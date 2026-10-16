import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AddLeadSec from './addLeadSec';
import api from '../../api';

jest.mock('../../api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() }
}));

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Ada Lovelace' } });
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'ada@example.test' } });
  fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '0300' } });
  fireEvent.change(screen.getByLabelText('Assigned To'), { target: { value: 'Sam' } });
};

beforeEach(() => jest.clearAllMocks());

// Regression: the /addlead page renders the form without an onClose handler. A successful save used to throw
// ("onClose is not a function") and the catch block reported it as "Server error: Failed to add lead".
test('a successful save without onClose does not show an error', async () => {
  api.post.mockResolvedValue({ data: { success: true } });
  render(<AddLeadSec variant="page" />);
  fillValidForm();
  fireEvent.click(screen.getByRole('button', { name: /save lead/i }));

  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith('/api/leads', expect.objectContaining({ name: 'Ada Lovelace', status: 'New' }));
});

test('a successful save calls onLeadAdded and onClose', async () => {
  api.post.mockResolvedValue({ data: { success: true } });
  const onClose = jest.fn();
  const onLeadAdded = jest.fn();
  render(<AddLeadSec onClose={onClose} onLeadAdded={onLeadAdded} />);
  fillValidForm();
  fireEvent.click(screen.getByRole('button', { name: /save lead/i }));

  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(onLeadAdded).toHaveBeenCalledTimes(1);
});

test('the server message is shown when the lead is rejected, and the form stays open', async () => {
  api.post.mockRejectedValue({ response: { status: 409, data: { message: 'A lead with this email already exists' } } });
  const onClose = jest.fn();
  render(<AddLeadSec onClose={onClose} />);
  fillValidForm();
  fireEvent.click(screen.getByRole('button', { name: /save lead/i }));

  expect(await screen.findByRole('alert')).toHaveTextContent('A lead with this email already exists');
  expect(onClose).not.toHaveBeenCalled();
});

test('a network failure shows a connection message', async () => {
  api.post.mockRejectedValue(new Error('Network Error'));
  render(<AddLeadSec variant="page" />);
  fillValidForm();
  fireEvent.click(screen.getByRole('button', { name: /save lead/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i);
});

test('the status options use the canonical values', () => {
  render(<AddLeadSec variant="page" />);
  const options = Array.from(screen.getByLabelText('Status').querySelectorAll('option')).map((o) => o.value);
  expect(options).toEqual(['New', 'Contacted', 'Converted']);
});
