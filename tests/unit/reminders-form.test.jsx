import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../src/lib/api';
import * as remindersAPI from '../../src/lib/api/reminders';
import ReminderForm from '../../src/modules/reminders/ReminderForm';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/reminders');
vi.mock('../../src/lib/api');
vi.mock('../../src/router');

vi.mock('../../src/components/EntitySelect', () => ({
  default: ({ value, onChange, placeholder, id }) => (
    <select
      id={id}
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

vi.mock('../../src/components/ui-DatePicker', () => {
  return {
    DatePicker: ({ value, onChange, id }) => (
      <input
        id={id}
        type="date"
        value={value ? (value.format ? value.format('YYYY-MM-DD') : dayjs(value).format('YYYY-MM-DD')) : ''}
        onChange={(e) => onChange(dayjs(e.target.value))}
        placeholder="Выберите дату"
      />
    ),
  };
});

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
};

describe('ReminderForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    remindersAPI.getReminder.mockResolvedValue(mockReminder);
    remindersAPI.createReminder.mockResolvedValue({ id: 1, ...mockReminder });
    remindersAPI.updateReminder.mockResolvedValue(mockReminder);
    api.getUsers.mockResolvedValue({ results: [{ id: 1, name: 'John Doe' }] });
    api.getUser.mockResolvedValue({ id: 1, name: 'John Doe' });
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', async () => {
      render(<ReminderForm />);

      await waitFor(() => {
        expect(screen.getByText(/Новое напоминание/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Тема/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Описание/i)).toBeInTheDocument();
    });

    it('submits form with valid data', async () => {
      render(<ReminderForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Тема/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Тема/i), { target: { value: 'New reminder' } });
      fireEvent.change(screen.getByLabelText(/Content type ID/i), { target: { value: '12' } });
      fireEvent.change(screen.getByLabelText(/Object ID/i), { target: { value: '5' } });
      fireEvent.change(screen.getByLabelText(/Дата и время напоминания/i), { target: { value: '2024-03-01' } });

      const submitButton = screen.getByRole('button', { name: /Создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(remindersAPI.createReminder).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith('/reminders');
      });
    });

    it('handles API error on create', async () => {
      remindersAPI.createReminder.mockRejectedValue(new Error('API Error'));

      render(<ReminderForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Тема/i)).toBeInTheDocument();
      });

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/Тема/i), { target: { value: 'New reminder' } });
      fireEvent.change(screen.getByLabelText(/Content type ID/i), { target: { value: '12' } });
      fireEvent.change(screen.getByLabelText(/Object ID/i), { target: { value: '5' } });
      fireEvent.change(screen.getByLabelText(/Дата и время напоминания/i), { target: { value: '2024-03-01' } });

      const submitButton = screen.getByRole('button', { name: /Создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(remindersAPI.createReminder).toHaveBeenCalled();
      });

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('loads and displays existing reminder data', async () => {
      render(<ReminderForm id={1} />);

      await waitFor(() => {
        expect(remindersAPI.getReminder).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/Тема/i)).toHaveValue('Test reminder');
        expect(screen.getByLabelText(/Описание/i)).toHaveValue('Test description');
      });
    });

    it('submits updated reminder data', async () => {
      render(<ReminderForm id={1} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Тема/i)).toHaveValue('Test reminder');
      });

      fireEvent.change(screen.getByLabelText(/Тема/i), { target: { value: 'Updated reminder' } });

      const submitButton = screen.getByRole('button', { name: /Сохранить/i });
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
  });

  describe('Form Fields', () => {
    it('renders all form fields', async () => {
      render(<ReminderForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Тема/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Описание/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Дата и время напоминания/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Активно/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email уведомление/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Владелец/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Content type ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Object ID/i)).toBeInTheDocument();
    });

    it('handles switch toggles', async () => {
      render(<ReminderForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Активно/i)).toBeInTheDocument();
      });

      const activeSwitch = screen.getByLabelText(/Активно/i);
      const emailSwitch = screen.getByLabelText(/Email уведомление/i);

      // Ant Design switch or Shadcn switch might have different checked implementation in JSDOM
      // usually it's the aria-checked or data-state
      fireEvent.click(activeSwitch);
      fireEvent.click(emailSwitch);
      
      // We check if value changed by looking at API call or internal state if possible
      // but simpler is to check attributes if the component supports them
    });
  });

  describe('Navigation', () => {
    it('navigates back on cancel', async () => {
      render(<ReminderForm />);

      await waitFor(() => {
        expect(screen.getByText(/Новое напоминание/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Отмена');
      fireEvent.click(cancelButton);
      expect(router.navigate).toHaveBeenCalledWith('/reminders');
    });

    it('navigates back on back button', async () => {
      render(<ReminderForm />);

      await waitFor(() => {
        expect(screen.getByText(/Новое напоминание/i)).toBeInTheDocument();
      });

      const backButton = screen.getByText('Назад');
      fireEvent.click(backButton);
      expect(router.navigate).toHaveBeenCalledWith('/reminders');
    });
  });
});
