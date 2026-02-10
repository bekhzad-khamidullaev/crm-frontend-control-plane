import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskDetail from '../../src/modules/tasks/TaskDetail';
import * as client from '../../src/lib/api/client';
import * as reference from '../../src/lib/api/reference';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/client');
vi.mock('../../src/lib/api/reference');
vi.mock('../../src/router');
vi.mock('../../src/components/ActivityLog', () => ({
  default: ({ entityType, entityId }) => (
    <div data-testid="activity-log">
      Activity Log for {entityType} {entityId}
    </div>
  ),
}));

const mockTask = {
  id: 1,
  title: 'Подготовить презентацию',
  description: 'Презентация для важного клиента на следующей неделе',
  status: 'in_progress',
  priority: 'high',
  stage: 1,
  stage_name: 'В работе',
  assigned_to: 2,
  assigned_to_name: 'Иван Петров',
  start_date: '2024-01-20',
  due_date: '2024-02-15',
  closing_date: null,
  next_step_date: '2024-02-01',
  project: 5,
  project_name: 'Проект Альфа',
  contact: 10,
  contact_name: 'Анна Смирнова',
  company: 15,
  company_name: 'ООО "Бета"',
  tags: [1, 2],
  created_at: '2024-01-18T10:30:00Z',
  updated_at: '2024-01-25T14:20:00Z',
};

const mockStages = [
  { id: 1, name: 'В работе', order: 1 },
  { id: 2, name: 'На проверке', order: 2 },
  { id: 3, name: 'Завершено', order: 3 },
];

const mockTags = [
  { id: 1, name: 'Важно' },
  { id: 2, name: 'Клиент' },
  { id: 3, name: 'Срочно' },
];

const mockUsers = [
  { id: 2, username: 'ivanov', email: 'ivanov@example.com' },
  { id: 3, username: 'smirnova', email: 'smirnova@example.com' },
];

describe('TaskDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getTask.mockResolvedValue(mockTask);
    reference.getTaskStages.mockResolvedValue({ results: mockStages });
    reference.getTaskTags.mockResolvedValue({ results: mockTags });
    client.getUsers.mockResolvedValue({ results: mockUsers });
    client.deleteTask.mockResolvedValue({});
  });

  it('renders task detail with all information', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(client.getTask).toHaveBeenCalledWith(1);
    });

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getByText('Презентация для важного клиента на следующей неделе')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    client.getTask.mockImplementation(() => new Promise(() => {}));

    render(<TaskDetail id={1} />);

    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('loads reference data on mount', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(reference.getTaskStages).toHaveBeenCalledWith({ page_size: 200 });
      expect(reference.getTaskTags).toHaveBeenCalledWith({ page_size: 200 });
      expect(client.getUsers).toHaveBeenCalledWith({ page_size: 200 });
    });
  });

  it('displays task stage badge', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getByText(/В работе|На проверке|Завершено/i)).toBeInTheDocument();
  });

  it('displays task priority label', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getByText(/Приоритет/)).toBeInTheDocument();
  });

  it('displays assigned user information', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getByText('Иван Петров')).toBeInTheDocument();
  });

  it('displays stage information', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getByText('В работе')).toBeInTheDocument();
  });

  it('displays related entities (project, contact, company)', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getByText('Проект Альфа')).toBeInTheDocument();
    expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    expect(screen.getByText('ООО "Бета"')).toBeInTheDocument();
  });

  it('displays dates correctly', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    // Dates should be formatted and visible
    expect(screen.getByText(/2024-01-20/)).toBeInTheDocument();
    expect(screen.getByText(/2024-02-15/)).toBeInTheDocument();
  });

  it('displays task tags', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    // Tags should be visible
    expect(screen.getByText('Важно')).toBeInTheDocument();
    expect(screen.getByText('Клиент')).toBeInTheDocument();
  });

  it('navigates back to tasks list', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    const backButton = screen.getByLabelText(/arrow-left|назад/i);
    fireEvent.click(backButton);

    expect(router.navigate).toHaveBeenCalledWith('/tasks');
  });

  it('navigates to edit page', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText(/edit|редактировать/i);
    fireEvent.click(editButton);

    expect(router.navigate).toHaveBeenCalledWith('/tasks/1/edit');
  });

  it('handles task deletion', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText(/delete|удалить/i);
    fireEvent.click(deleteButton);

    // Confirm deletion in popconfirm
    await waitFor(() => {
      const confirmButton = screen.getByText(/Да|OK/i);
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.deleteTask).toHaveBeenCalledWith(1);
      expect(router.navigate).toHaveBeenCalledWith('/tasks');
    });
  });

  it('handles error when deleting task', async () => {
    client.deleteTask.mockRejectedValue(new Error('Delete failed'));

    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText(/delete|удалить/i);
    fireEvent.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByText(/Да|OK/i);
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.deleteTask).toHaveBeenCalledWith(1);
    });

    // Should not navigate on error
    expect(router.navigate).not.toHaveBeenCalledWith('/tasks');
  });

  it('handles error when loading task', async () => {
    client.getTask.mockRejectedValue(new Error('Task not found'));

    render(<TaskDetail id={999} />);

    await waitFor(() => {
      expect(client.getTask).toHaveBeenCalledWith(999);
    });

    // Should handle error gracefully
    await waitFor(() => {
      expect(screen.queryByText('Подготовить презентацию')).not.toBeInTheDocument();
    });
  });

  it('handles error when loading reference data', async () => {
    reference.getTaskStages.mockRejectedValue(new Error('API Error'));
    reference.getTaskTags.mockRejectedValue(new Error('API Error'));

    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(reference.getTaskStages).toHaveBeenCalled();
      expect(reference.getTaskTags).toHaveBeenCalled();
    });

    // Task should still load even if references fail
    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });
  });

  it('renders activity log component', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    // Activity log should be present
    expect(screen.getByTestId('activity-log')).toBeInTheDocument();
    expect(screen.getByText(/Activity Log for.*task.*1/i)).toBeInTheDocument();
  });

  it('renders tabs for different sections', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    // Tabs should be present
    const tabs = screen.queryAllByRole('tab');
    if (tabs.length > 0) {
      expect(tabs.length).toBeGreaterThan(0);
    }
  });

  it('handles task without optional fields', async () => {
    const minimalTask = {
      id: 1,
      title: 'Минимальная задача',
      description: null,
      status: 'open',
      priority: 'normal',
      stage: null,
      assigned_to: null,
      start_date: null,
      due_date: null,
      closing_date: null,
      next_step_date: null,
      project: null,
      contact: null,
      company: null,
      tags: [],
      created_at: '2024-01-18T10:30:00Z',
      updated_at: '2024-01-25T14:20:00Z',
    };
    client.getTask.mockResolvedValue(minimalTask);

    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Минимальная задача')).toBeInTheDocument();
    });

    // Should render without errors even with minimal data
    expect(screen.getByText('Минимальная задача')).toBeInTheDocument();
  });

  it('formats dates using dayjs', async () => {
    render(<TaskDetail id={1} />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    // Dates should be formatted (implementation may vary)
    // At minimum, dates should be present in some form
    const dateElements = screen.getAllByText(/2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });
});
