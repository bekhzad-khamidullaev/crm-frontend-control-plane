import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../src/lib/api';
import * as remindersAPI from '../../src/lib/api/reminders';
import RemindersList from '../../src/modules/reminders/RemindersList';
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

// Mock EnhancedTable to simplify pagination testing
vi.mock('../../src/components/ui-EnhancedTable', () => ({
  default: ({ columns, dataSource, pagination, onChange }) => (
    <div>
      <table role="table">
        <thead>
          <tr>{columns.map(c => <th key={c.key}>{c.title}</th>)}</tr>
        </thead>
        <tbody>
          {dataSource.map(row => (
            <tr key={row.id}>
              {columns.map(c => (
                <td key={c.key}>{c.render ? c.render(row[c.dataIndex], row) : row[c.dataIndex]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div data-testid="pagination">
        <button onClick={() => onChange({ ...pagination, current: pagination.current - 1 })} disabled={pagination.current === 1}>Назад</button>
        <span>Page {pagination.current}</span>
        <button onClick={() => onChange({ ...pagination, current: pagination.current + 1 })} name="Next">Вперёд</button>
      </div>
    </div>
  )
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
    reminder_date: '2099-02-20T14:00:00Z', // Future date
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
    api.getUser.mockResolvedValue({ id: 1, name: 'John Doe' });
    
    // Set a fixed "now" for testing relative dates if needed,
    // but the component uses dayjs() which might be hard to mock global
  });

  describe('Rendering', () => {
    it('renders reminders list', async () => {
      render(<RemindersList />);

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      expect(screen.getByText('Send invoice')).toBeInTheDocument();
      expect(screen.getByText('Meeting prep')).toBeInTheDocument();
    });

    it('displays reminder status tags', async () => {
      render(<RemindersList />);

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const activeTags = screen.getAllByText('Активно');
      expect(activeTags.length).toBeGreaterThan(0);
      
      const inactiveTags = screen.getAllByText('Неактивно');
      expect(inactiveTags.length).toBeGreaterThan(0);
    });

    it('shows overdue status for past reminders', async () => {
      render(<RemindersList />);

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      // Meeting prep has a past date
      expect(screen.getAllByText(/Просрочено/i).length).toBeGreaterThan(0);
    });
  });

  describe('Filtering', () => {
    it('filters by search text', async () => {
      render(<RemindersList />);

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Поиск по теме или описанию/i);
      fireEvent.change(searchInput, { target: { value: 'invoice' } });
      
      // TableToolbar might need Enter or trigger on change
      // Based on implementation, it calls handleSearch (onSearch)
      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'invoice' })
        );
      });
    });

    it('filters by active status', async () => {
      render(<RemindersList />);

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const activeFilter = screen.getByLabelText(/Фильтр активности/i);
      fireEvent.change(activeFilter, { target: { value: 'true' } });

      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalledWith(
          expect.objectContaining({ active: true })
        );
      });
    });

    it('filters by owner', async () => {
      render(<RemindersList />);

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
  });

  describe('Actions', () => {
    it('navigates to create page on new button click', async () => {
      render(<RemindersList />);

      await waitFor(() => {
        expect(screen.getByText(/Новое напоминание/i)).toBeInTheDocument();
      });

      const newButton = screen.getByText(/Новое напоминание/i);
      fireEvent.click(newButton);

      expect(router.navigate).toHaveBeenCalledWith('/reminders/new');
    });

    it('toggles active status', async () => {
      render(<RemindersList />);

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const toggleButtons = screen.getAllByText(/Откл\.|Вкл\./i);
      fireEvent.click(toggleButtons[0]);

      await waitFor(() => {
        expect(remindersAPI.updateReminder).toHaveBeenCalled();
      });
    });

    it('deletes reminder with confirmation', async () => {
      render(<RemindersList />);

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Удалить');
      // The first one is in the table row
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        // Now find the "Удалить" in the AlertDialog
        // We use getAllByRole and filter or use the container if needed
        // but typically the dialog is last.
        const confirmButton = screen.getAllByRole('button', { name: 'Удалить' }).find(btn => btn.closest('.fixed') || btn.closest('[role="dialog"]'));
        if (confirmButton) {
           fireEvent.click(confirmButton);
        } else {
           // fallback to index if structure is simple
           fireEvent.click(screen.getAllByText('Удалить').pop());
        }
      });

      await waitFor(() => {
        expect(remindersAPI.deleteReminder).toHaveBeenCalled();
      });
    });
  });

  describe('Pagination', () => {
    it('updates page on pagination change', async () => {
      render(<RemindersList />);

      await waitFor(() => {
        expect(screen.getByText('Call client')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Вперёд');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(remindersAPI.getReminders).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });
  });
});
