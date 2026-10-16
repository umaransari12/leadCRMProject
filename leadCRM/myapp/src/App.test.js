import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');
});

test('shows the sign-in page to a visitor without a token', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
});

test('redirects a protected route to sign-in when there is no token', () => {
  window.history.pushState({}, '', '/dashboard');
  render(<App />);
  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
});

test('sends a signed-in user from the sign-in page to the dashboard', () => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify({ name: 'Test User', email: 'test@example.test' }));
  window.history.pushState({}, '', '/');
  render(<App />);
  expect(screen.getByRole('heading', { name: /^dashboard$/i })).toBeInTheDocument();
  // The signed-in user's own name is shown, not a hardcoded one.
  expect(screen.getByText('Test User')).toBeInTheDocument();
});
