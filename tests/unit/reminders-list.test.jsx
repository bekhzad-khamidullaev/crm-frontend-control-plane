import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RemindersList from '../../src/modules/reminders/RemindersList';
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

const mockReminders = [
  {
    id: 1,
    subject: 'Call client',
    description: 'Follow up on proposal',
    reminder_date: '2024-02-15T10:00:00Z',
    active: true,
    content_type: 12,
    object_id: 5,
    owner_name: 'John Doe',
  },
  {
    id: 2,
    subject: 'Send invoice',
    description: 'Monthly invoice',
    reminder_date: '2024-02-20T14:00:00Z',
    active: false,
    content_type: 12,
    object_id: 6,
    owner_name: 'Jane Smith',
  },
  {
    id: 3,
    subject: 'Meeting prep',
    description: 'Prepare presentation',
    reminder_date: '2024-01-10T09:00:00Z',
    active: true,
    content_type: 15,
    object_id: 10,
    owner_name: 'Bob Johnson',
  },
];

const TestWrapper = ({ children }) => <>{children}</>;

describe('RemindersList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    remindersAPI.getReminders.mockResolvedValue({
      results: mockReminders,
      count: mockReminders.length,
    });
    remindersAPI.deleteReminder.mockResolvedValue(undefined);
    remindersAPI.updateReminder.mockResolvedValue({ id: 1 });
    api.getUsers.mockResolvedValue({ results: [] });
    api.getUser.mockResolvedValue({ id: 1, username: 'testuser' });
  });

  describe('Rendering', () => {
    it('renders reminders list', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      expect(screen.getByText('Send invoice')).toBeInTheDocument();
      expect(screen.getByText('Meeting prep')).toBeInTheDocument();
    });

    it('displays reminder status tags', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const activeTags = screen.getAllByText('Активно');
      expect(activeTags.length).toBeGreaterThan(0);
      
      const inactiveTags = screen.getAllByText('Неактивно');
      expect(inactiveTags.length).toBeGreaterThan(0);
    });

    it('shows overdue status for past reminders', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      // Meeting prep has a past date (2024-01-10)
      expect(screen.getByText(/Просрочено/i)).toBeInTheDocument();
    });

    it('displays content type and object ID', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      // Check that content types are displayed
      const cells = screen.getAllByText('12');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('displays owner names', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters by search text', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Поиск по теме или описанию/i);
      fireEvent.change(searchInput, { target: { value: 'invoice' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'invoice' })
        );
      });
    });

    it('filters by active status', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const activeFilter = screen.getByRole('combobox');
      fireEvent.change(activeFilter, { target: { value: 'true' } });

      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalledWith(
          expect.objectContaining({ active: true })
        );
      });
    });

    it('filters by owner', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const ownerSelect = screen.getByTestId('entity-select-Владелец');
      fireEvent.change(ownerSelect, { target: { value: '1' } });

      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalledWith(
          expect.objectContaining({ owner: 1 })
        );
      });
    });

    it('filters by content type', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const contentTypeInput = screen.getByPlaceholderText(/Content type ID/i);
      fireEvent.change(contentTypeInput, { target: { value: '12' } });

      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalledWith(
          expect.objectContaining({ content_type: 12 })
        );
      });
    });
  });

  describe('Actions', () => {
    it('navigates to create page on new button click', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const newButton = screen.getByText(/Новое напоминание/i);
      fireEvent.click(newButton);

      expect(router.navigate).toHaveBeenCalledWith('/reminders/new');
    });

    it('navigates to detail page on view button click', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText(/Открыть/i);
      fireEvent.click(viewButtons[0]);

      expect(router.navigate).toHaveBeenCalledWith('/reminders/1');
    });

    it('navigates to edit page on edit button click', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText(/Ред\./i);
      fireEvent.click(editButtons[0]);

      expect(router.navigate).toHaveBeenCalledWith('/reminders/1/edit');
    });

    it('toggles active status', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      // Find toggle button (should show "Откл." for active reminders)
      const toggleButtons = screen.getAllByText(/Откл\.|Вкл\./i);
      fireEvent.click(toggleButtons[0]);

      await waitFor(() => {
        expect(remindersAPI.updateReminder).toHaveBeenCalledWith(
          expect.any(Number),
          expect.objectContaining({ active: expect.any(Boolean) })
        );
      });
    });

    it('deletes reminder with confirmation', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText(/Удалить/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        const confirmButton = screen.getByText(/Удалить/);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(remindersAPI.deleteReminder).toHaveBeenCalled();
      });
    });

    it('handles delete error', async () => {
      remindersAPI.deleteReminder.mockRejectedValue(new Error('Delete failed'));

      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText(/Удалить/i);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        const confirmButton = screen.getByText(/Удалить/);
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(remindersAPI.deleteReminder).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination', () => {
    it('calls API with pagination params', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
            page_size: 10,
          })
        );
      });
    });

    it('updates page on pagination change', async () => {
      const manyReminders = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        subject: `Reminder ${i + 1}`,
        reminder_date: '2024-02-15T10:00:00Z',
        active: true,
        content_type: 12,
        object_id: i + 1,
      }));

      remindersAPI.getReminders.mockResolvedValue({
        results: manyReminders.slice(0, 10),
        count: 15,
      });

      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Reminder 1')).toBeInTheDocument();
      });

      // Find and click next page button
      const nextButtons = screen.getAllByRole('button', { name: /Вперёд|Вперед|Next/i });
      if (nextButtons.length > 0) {
        fireEvent.click(nextButtons[0]);

        await waitFor(() => {
          expect(remindersAPI.getReminders).toHaveBeenCalledWith(
            expect.objectContaining({ page: 2 })
          );
        });
      }
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state', () => {
      remindersAPI.getReminders.mockImplementation(() => new Promise(() => {}));

      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles API error', async () => {
      remindersAPI.getReminders.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalled();
      });
    });

    it('shows empty state when no reminders', async () => {
      remindersAPI.getReminders.mockResolvedValue({
        results: [],
        count: 0,
      });

      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalled();
      });

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('applies default ordering by reminder_date', async () => {
      render(
        <TestWrapper>
          <RemindersList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalledWith(
          expect.objectContaining({
            ordering: '-reminder_date',
          })
        );
      });
    });
  });
});
