import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../src/lib/api';
import * as remindersApi from '../../src/lib/api/reminders';
import * as rbac from '../../src/lib/rbac';
import ReminderForm from '../../src/modules/reminders/ReminderForm';

vi.mock('../../src/lib/rbac', () => ({
  canWrite: vi.fn(),
}));

vi.mock('../../src/lib/api/reminders', () => ({
  createReminder: vi.fn(),
  getReminder: vi.fn(),
  updateReminder: vi.fn(),
}));

vi.mock('../../src/lib/api', () => ({
  getUsers: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('../../src/router', () => ({
  navigate: vi.fn(),
}));

vi.mock('../../src/components/EntitySelect', () => ({
  default: ({ value, onChange, placeholder, id }) => (
    <select id={id} data-testid="owner-select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      <option value="1">User #1</option>
    </select>
  ),
}));

describe('ReminderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rbac.canWrite.mockReturnValue(true);
    api.getUsers.mockResolvedValue({ results: [] });
    remindersApi.getReminder.mockResolvedValue({
      id: 1,
      subject: 'Test reminder',
      description: 'Test description',
      reminder_date: '2024-02-15T10:00:00Z',
      content_type: 12,
      object_id: 5,
      owner: 1,
      active: true,
    });
  });

  it('renders create form fields', () => {
    render(<ReminderForm />);

    expect(screen.getByLabelText(/тема/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/тип объекта/i)).toBeInTheDocument();
    expect(screen.getByText(/новое напоминание/i)).toBeInTheDocument();
  });

  it('loads reminder in edit mode', async () => {
    render(<ReminderForm id={1} />);

    await waitFor(() => {
      expect(remindersApi.getReminder).toHaveBeenCalledWith(1);
    });
  });

  it('renders permission denied state without write permission', () => {
    rbac.canWrite.mockReturnValue(false);

    render(<ReminderForm />);

    expect(screen.getByText('Недостаточно прав')).toBeInTheDocument();
    expect(screen.getByText('У вас нет прав для создания или редактирования напоминаний.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /создать|сохранить/i })).not.toBeInTheDocument();
  });
});
