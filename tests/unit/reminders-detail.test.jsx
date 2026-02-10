import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReminderDetail from '../../src/modules/reminders/ReminderDetail';
import * as remindersAPI from '../../src/lib/api/reminders';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/reminders');
vi.mock('../../src/router');

const mockReminder = {
  id: 1,
  subject: 'Test reminder',
  description: 'Test description',
  reminder_date: '2024-02-15T10:00:00Z',
  active: true,
  send_notification_email: true,
  content_type: 12,
  object_id: 5,
  owner: 1,
  owner_name: 'John Doe',
  creation_date: '2024-01-15T08:00:00Z',
};

const pastReminder = {
  ...mockReminder,
  id: 2,
  subject: 'Past reminder',
  reminder_date: '2024-01-10T09:00:00Z',
  active: true,
};

const TestWrapper = ({ children }) => <>{children}</>;

describe('ReminderDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    remindersAPI.getReminder.mockResolvedValue(mockReminder);
    remindersAPI.deleteReminder.mockResolvedValue(undefined);
    remindersAPI.updateReminder.mockResolvedValue({ id: 1 });
  });

  describe('Rendering', () => {
    it('renders reminder details', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(remindersAPI.getReminder).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays all fields correctly', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      // Check status
      expect(screen.getByText('Активно')).toBeInTheDocument();
      
      // Check email notification
      expect(screen.getByText('Да')).toBeInTheDocument();
      
      // Check content type and object ID
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      remindersAPI.getReminder.mockImplementation(() => new Promise(() => {}));

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('handles reminder not found', async () => {
      remindersAPI.getReminder.mockResolvedValue(null);

      render(
        <TestWrapper>
          <ReminderDetail id={999} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Напоминание не найдено/i)).toBeInTheDocument();
      });
    });

    it('handles API error', async () => {
      remindersAPI.getReminder.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(remindersAPI.getReminder).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Status Display', () => {
    it('shows active status tag', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const statusTag = screen.getByText('Активно');
      expect(statusTag).toBeInTheDocument();
    });

    it('shows inactive status tag', async () => {
      remindersAPI.getReminder.mockResolvedValue({
        ...mockReminder,
        active: false,
      });

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const statusTag = screen.getByText('Неактивно');
      expect(statusTag).toBeInTheDocument();
    });

    it('shows overdue indicator for past reminders', async () => {
      remindersAPI.getReminder.mockResolvedValue(pastReminder);

      render(
        <TestWrapper>
          <ReminderDetail id={2} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Past reminder')).toBeInTheDocument();
      });

      expect(screen.getByText(/Просрочено/i)).toBeInTheDocument();
    });

    it('does not show overdue for future reminders', async () => {
      const futureReminder = {
        ...mockReminder,
        reminder_date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      };
      remindersAPI.getReminder.mockResolvedValue(futureReminder);

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Просрочено/i)).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('navigates back on back button click', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Назад');
      fireEvent.click(backButton);

      expect(router.navigate).toHaveBeenCalledWith('/reminders');
    });

    it('navigates to edit page on edit button click', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Редактировать');
      fireEvent.click(editButton);

      expect(router.navigate).toHaveBeenCalledWith('/reminders/1/edit');
    });

    it('toggles active status from active to inactive', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const toggleButton = screen.getByText('Отключить');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(remindersAPI.updateReminder).toHaveBeenCalledWith(1, { active: false });
      });
    });

    it('toggles active status from inactive to active', async () => {
      remindersAPI.getReminder.mockResolvedValue({
        ...mockReminder,
        active: false,
      });

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const toggleButton = screen.getByText('Включить');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(remindersAPI.updateReminder).toHaveBeenCalledWith(1, { active: true });
      });
    });

    it('handles toggle error', async () => {
      remindersAPI.updateReminder.mockRejectedValue(new Error('Update failed'));

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const toggleButton = screen.getByText('Отключить');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(remindersAPI.updateReminder).toHaveBeenCalled();
      });
    });

    it('deletes reminder with confirmation', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Удалить');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByText(/Удалить/);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(remindersAPI.deleteReminder).toHaveBeenCalledWith(1);
        expect(router.navigate).toHaveBeenCalledWith('/reminders');
      });
    });

    it('handles delete error', async () => {
      remindersAPI.deleteReminder.mockRejectedValue(new Error('Delete failed'));

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Удалить');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        const confirmButton = screen.getByText(/Удалить/);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(remindersAPI.deleteReminder).toHaveBeenCalled();
      });

      // Should not navigate on error
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Data Display', () => {
    it('displays email notification setting', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      expect(screen.getByText('Да')).toBeInTheDocument();
    });

    it('handles missing email notification', async () => {
      remindersAPI.getReminder.mockResolvedValue({
        ...mockReminder,
        send_notification_email: false,
      });

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      expect(screen.getByText('Нет')).toBeInTheDocument();
    });

    it('handles missing description', async () => {
      remindersAPI.getReminder.mockResolvedValue({
        ...mockReminder,
        description: null,
      });

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const descriptionCells = screen.getAllByText('-');
      expect(descriptionCells.length).toBeGreaterThan(0);
    });

    it('handles missing owner', async () => {
      remindersAPI.getReminder.mockResolvedValue({
        ...mockReminder,
        owner_name: null,
      });

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const emptyCells = screen.getAllByText('-');
      expect(emptyCells.length).toBeGreaterThan(0);
    });

    it('handles missing reminder_date', async () => {
      remindersAPI.getReminder.mockResolvedValue({
        ...mockReminder,
        reminder_date: null,
      });

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const emptyCells = screen.getAllByText('-');
      expect(emptyCells.length).toBeGreaterThan(0);
    });

    it('formats dates correctly', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      // Check that dates are formatted (dayjs format: 'DD MMM YYYY HH:mm')
      // The exact format depends on locale, but we can check it exists
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });
  });

  describe('Content Type and Object ID', () => {
    it('displays content type ID', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('displays object ID', async () => {
      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('handles missing content type and object ID', async () => {
      remindersAPI.getReminder.mockResolvedValue({
        ...mockReminder,
        content_type: null,
        object_id: null,
      });

      render(
        <TestWrapper>
          <ReminderDetail id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test reminder')).toBeInTheDocument();
      });

      const emptyCells = screen.getAllByText('-');
      expect(emptyCells.length).toBeGreaterThan(0);
    });
  });
});
