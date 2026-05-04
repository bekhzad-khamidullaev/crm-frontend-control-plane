import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as remindersAPI from '../../src/lib/api/reminders';
import ReminderDetail from '../../src/modules/reminders/ReminderDetail';
import * as rbac from '../../src/lib/rbac.js';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/reminders');
vi.mock('../../src/lib/rbac.js', () => ({
  canWrite: vi.fn(),
}));
vi.mock('../../src/router');

vi.mock('../../src/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }) => <div>{children}</div>,
  AlertDialogCancel: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  AlertDialogAction: ({ children, onClick }) => <button data-testid="alert-dialog-action" onClick={onClick}>{children}</button>,
}));

const mockReminder = {
  id: 1,
  subject: 'Test reminder',
  description: 'Test description',
  reminder_date: '2024-02-15T10:00:00Z',
  active: true,
  content_type: 12,
  object_id: 5,
  owner_name: 'John Doe',
  send_notification_email: true,
  creation_date: '2024-01-01T12:00:00Z',
};

describe('ReminderDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rbac.canWrite.mockReturnValue(true);
    remindersAPI.getReminder.mockResolvedValue(mockReminder);
    remindersAPI.deleteReminder.mockResolvedValue(undefined);
    remindersAPI.updateReminder.mockResolvedValue({ id: 1 });
  });

  describe('Data Display', () => {
    it('displays reminder details correctly', async () => {
      render(<ReminderDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('formats dates correctly', async () => {
      render(<ReminderDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      expect(screen.getByText(/15\.02\.2024 15:00/)).toBeInTheDocument();
      expect(screen.getByText(/01\.01\.2024 17:00/)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('toggles active status', async () => {
      render(<ReminderDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole('button', { name: /отключить/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(remindersAPI.updateReminder).toHaveBeenCalledWith(1, { active: false });
      });
    });

    it('navigates to edit page', async () => {
      render(<ReminderDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /редактировать/i });
      fireEvent.click(editButton);

      expect(router.navigate).toHaveBeenCalledWith('/reminders/1/edit');
    });

    it('deletes reminder with confirmation', async () => {
      render(<ReminderDetail id={1} />);

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /удалить/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      const confirmButton = within(dialog).getByRole('button', { name: /удалить/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(remindersAPI.deleteReminder).toHaveBeenCalledWith(1);
        expect(router.navigate).toHaveBeenCalledWith('/reminders');
      });
    });
  });
});
