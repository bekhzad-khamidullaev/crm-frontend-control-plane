import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReminderForm from '../../src/modules/reminders/ReminderForm';
import * as remindersAPI from '../../src/lib/api/reminders';
import * as api from '../../src/lib/api';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/reminders');
vi.mock('../../src/lib/api');
vi.mock('../../src/router');
vi.mock('../../src/components/EntitySelect', () => ({
  default: ({ value, onChange, placeholder }) => (
    <select
      data-testid={`entity-select-${placeholder}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
    >
      <option value="">Выберите</option>
      <option value="1">User 1</option>
      <option value="2">User 2</option>
    </select>
  ),
}));

const mockReminder = {
  id: 1,
  subject: 'Test reminder',
  description: 'Test description',
  reminder_date: '2024-02-15T10:00:00Z',
  active: true,
  send_notification_email: false,
  content_type: 12,
  object_id: 5,
  owner: 1,
  owner_name: 'John Doe',
};

const TestWrapper = ({ children }) => <>{children}</>;

describe('ReminderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    remindersAPI.getReminder.mockResolvedValue(mockReminder);
    remindersAPI.createReminder.mockResolvedValue({ id: 1, ...mockReminder });
    remindersAPI.updateReminder.mockResolvedValue(mockReminder);
    api.getUsers.mockResolvedValue({ results: [] });
    api.getUser.mockResolvedValue({ id: 1, username: 'testuser' });
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', async () => {
      render(
        <TestWrapper>
          <ReminderForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Новое напоминание/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Тема/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Описание/i)).toBeInTheDocument();
    });

    it('has correct initial form values', async () => {
      render(
        <TestWrapper>
          <ReminderForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Новое напоминание/i)).toBeInTheDocument();
      });

      // Check default values for switches
      const activeSwitch = screen.getAllByRole('switch')[0];
      const emailSwitch = screen.getAllByRole('switch')[1];
      
      expect(activeSwitch).toBeChecked();
      expect(emailSwitch).not.toBeChecked();
    });

    it('submits form with valid data', async () => {
      render(
        <TestWrapper>
          <ReminderForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Тема/i)).toBeInTheDocument();
      });

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/Тема/i), {
        target: { value: 'New reminder' },
      });
      
      fireEvent.change(screen.getByLabelText(/Content type ID/i), {
        target: { value: '12' },
      });
      
      fireEvent.change(screen.getByLabelText(/Object ID/i), {
        target: { value: '5' },
      });

      // Submit form
      const submitButton = screen.getByText(/Создать/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(remindersAPI.createReminder).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith('/reminders');
      });
    });

    it('shows validation error for empty required fields', async () => {
      render(
        <TestWrapper>
          <ReminderForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Тема/i)).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByText(/Создать/i);
      fireEvent.click(submitButton);

      // Form should not call API without required fields
      await waitFor(() => {
        expect(remindersAPI.createReminder).not.toHaveBeenCalled();
      });
    });

    it('handles API error on create', async () => {
      remindersAPI.createReminder.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <ReminderForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Тема/i)).toBeInTheDocument();
      });

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Тема/i), {
        target: { value: 'New reminder' },
      });

      // Submit form
      const submitButton = screen.getByText(/Создать/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(remindersAPI.createReminder).toHaveBeenCalled();
      });

      // Should not navigate on error
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('loads and displays existing reminder data', async () => {
      render(
        <TestWrapper>
          <ReminderForm id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(remindersAPI.getReminder).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        const subjectInput = screen.getByLabelText(/Тема/i);
        expect(subjectInput).toHaveValue('Test reminder');
      });

      const descriptionInput = screen.getByLabelText(/Описание/i);
      expect(descriptionInput).toHaveValue('Test description');
    });

    it('shows loading state while fetching reminder', () => {
      remindersAPI.getReminder.mockImplementation(() => new Promise(() => {}));

      render(
        <TestWrapper>
          <ReminderForm id={1} />
        </TestWrapper>
      );

      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('submits updated reminder data', async () => {
      render(
        <TestWrapper>
          <ReminderForm id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        const subjectInput = screen.getByLabelText(/Тема/i);
        expect(subjectInput).toHaveValue('Test reminder');
      });

      // Update subject
      const subjectInput = screen.getByLabelText(/Тема/i);
      fireEvent.change(subjectInput, { target: { value: 'Updated reminder' } });

      // Submit form
      const submitButton = screen.getByText(/Сохранить/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(remindersAPI.updateReminder).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            subject: 'Updated reminder',
          })
        );
        expect(router.navigate).toHaveBeenCalledWith('/reminders');
      });
    });

    it('handles API error on update', async () => {
      remindersAPI.updateReminder.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <ReminderForm id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        const subjectInput = screen.getByLabelText(/Тема/i);
        expect(subjectInput).toHaveValue('Test reminder');
      });

      // Submit form
      const submitButton = screen.getByText(/Сохранить/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(remindersAPI.updateReminder).toHaveBeenCalled();
      });

      // Should not navigate on error
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('handles error when loading reminder', async () => {
      remindersAPI.getReminder.mockRejectedValue(new Error('Reminder not found'));

      render(
        <TestWrapper>
          <ReminderForm id={999} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(remindersAPI.getReminder).toHaveBeenCalledWith(999);
      });

      // Form should still render after error
      await waitFor(() => {
        expect(screen.getByText(/Редактирование напоминания/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    it('renders all form fields', async () => {
      render(
        <TestWrapper>
          <ReminderForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Тема/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Описание/i)).toBeInTheDocument();
      expect(screen.getByText(/Дата и время напоминания/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Активно/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email уведомление/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Владелец/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content type ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Object ID/i)).toBeInTheDocument();
    });

    it('handles switch toggles', async () => {
      render(
        <TestWrapper>
          <ReminderForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Активно/i)).toBeInTheDocument();
      });

      const activeSwitch = screen.getAllByRole('switch')[0];
      const emailSwitch = screen.getAllByRole('switch')[1];

      fireEvent.click(activeSwitch);
      expect(activeSwitch).not.toBeChecked();

      fireEvent.click(emailSwitch);
      expect(emailSwitch).toBeChecked();
    });
  });

  describe('Navigation', () => {
    it('navigates back on cancel', async () => {
      render(
        <TestWrapper>
          <ReminderForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Новое напоминание/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Отмена');
      fireEvent.click(cancelButton);
      expect(router.navigate).toHaveBeenCalledWith('/reminders');
    });

    it('navigates back on back button', async () => {
      render(
        <TestWrapper>
          <ReminderForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Новое напоминание/i)).toBeInTheDocument();
      });

      const backButton = screen.getByText('Назад');
      fireEvent.click(backButton);
      expect(router.navigate).toHaveBeenCalledWith('/reminders');
    });
  });
});
