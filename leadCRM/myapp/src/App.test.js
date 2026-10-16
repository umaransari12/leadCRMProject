import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import api from './api';

jest.mock('./api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }
}));

const lead = (overrides) => ({
  _id: String(Math.random()),
  name: 'Lead',
  email: 'lead@example.test',
  status: 'New',
  source: 'Website',
  createdAt: new Date().toISOString(),
  ...overrides
});

const signIn = (user = { name: 'Test User', email: 'test@example.test' }) => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify(user));
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  window.history.pushState({}, '', '/');
  api.get.mockResolvedValue({ data: { success: true, data: [] } });
});

test('shows the sign-in page to a visitor without a token', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
});

test.each(['/dashboard', '/lead', '/addlead', '/analytics', '/settings'])(
  'redirects %s to sign-in when there is no token',
  (path) => {
    window.history.pushState({}, '', path);
    render(<App />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  }
);

test('sends a signed-in user from the sign-in page to the dashboard and shows their own name', async () => {
  signIn();
  render(<App />);
  expect(await screen.findByRole('heading', { name: /^dashboard$/i })).toBeInTheDocument();
  expect(screen.getByText('Test User')).toBeInTheDocument();
  expect(screen.getByText('test@example.test')).toBeInTheDocument();
});

test('dashboard statistics come from the API data', async () => {
  signIn();
  window.history.pushState({}, '', '/dashboard');
  api.get.mockResolvedValue({
    data: {
      success: true,
      data: [lead({ status: 'New' }), lead({ status: 'contacted' }), lead({ status: 'Converted' }), lead({ status: 'New' })]
    }
  });
  const { container } = render(<App />);
  await waitFor(() => expect(container.querySelector('.stat_card.total .num')).toHaveTextContent('4'));
  expect(container.querySelector('.stat_card.new .num')).toHaveTextContent('2');
  expect(container.querySelector('.stat_card.contacted .num')).toHaveTextContent('1');
  expect(container.querySelector('.stat_card.converted .num')).toHaveTextContent('1');
});

test('dashboard shows an empty state instead of invented numbers when there are no leads', async () => {
  signIn();
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  expect(await screen.findByText(/you have no leads yet/i)).toBeInTheDocument();
});

test('signing in stores the session and opens the dashboard', async () => {
  api.post.mockResolvedValue({ data: { success: true, token: 'abc', user: { name: 'Zed', email: 'zed@example.test' } } });
  render(<App />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'zed@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password-123' } });
  fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

  expect(await screen.findByRole('heading', { name: /^dashboard$/i })).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/api/auth/login', { email: 'zed@example.test', password: 'Password-123' });
  expect(localStorage.getItem('token')).toBe('abc');
});

test('a failed sign-in shows the server message and stays on the sign-in page', async () => {
  api.post.mockRejectedValue({ response: { status: 401, data: { message: 'Invalid credentials' } } });
  render(<App />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'zed@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
  fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  expect(localStorage.getItem('token')).toBeNull();
});

test('an unreachable server gets a clear network message', async () => {
  api.post.mockRejectedValue(new Error('Network Error'));
  render(<App />);
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'zed@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password-123' } });
  fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i);
});

test('the password toggle reveals and hides the password', () => {
  render(<App />);
  const input = screen.getByLabelText('Password');
  expect(input).toHaveAttribute('type', 'password');
  fireEvent.click(screen.getByRole('button', { name: /show password/i }));
  expect(input).toHaveAttribute('type', 'text');
  fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
  expect(input).toHaveAttribute('type', 'password');
});

test('signup refuses mismatched passwords without calling the API', async () => {
  window.history.pushState({}, '', '/signup');
  render(<App />);
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New User' } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.test' } });
  fireEvent.change(screen.getByLabelText('Phone number'), { target: { value: '0300' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password-123' } });
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Different-123' } });
  fireEvent.click(screen.getByLabelText(/i agree to the terms/i));
  fireEvent.click(screen.getByRole('button', { name: /create account/i }));

  expect((await screen.findAllByText(/passwords do not match/i)).length).toBeGreaterThan(0);
  expect(api.post).not.toHaveBeenCalled();
});

test('Google sign-in is shown as unavailable, not faked, when no client ID is configured', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /continue with google \(not configured\)/i })).toBeDisabled();
});
