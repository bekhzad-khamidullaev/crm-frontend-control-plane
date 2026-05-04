import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../src/lib/api';
import * as rbac from '../../src/lib/rbac.js';
import TasksList from '../../src/modules/tasks/TasksList';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/tasks', () => ({
  getTasks: vi.fn(),
  getTask: vi.fn(),
  deleteTask: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock('../../src/lib/api/client', () => ({
  getUsers: vi.fn(),
}));

vi.mock('../../src/lib/api/reference', () => ({
  getTaskStages: vi.fn(),
  getTaskTags: vi.fn(),
}));
vi.mock('../../src/lib/rbac.js', () => ({
  canWrite: vi.fn(),
}));
vi.mock('../../src/router');

const mockTasks = [
  {
    id: 1,
    name: 'Подготовить презентацию',
    description: 'Презентация для клиента',
    status: 'open',
    priority: 3,
    due_date: '2024-02-15',
    responsible: [2],
    assigned_to_name: 'Иван Петров',
    stage: 1,
    stage_name: 'В работе',
    created_at: '2024-01-20',
  },
  {
    id: 2,
    name: 'Согласовать договор',
    description: 'Договор с ООО Альфа',
    status: 'in_progress',
    priority: 2,
    due_date: '2024-02-20',
    responsible: [3],
    assigned_to_name: 'Мария Смирнова',
    stage: 2,
    stage_name: 'На проверке',
    created_at: '2024-01-19',
  },
  {
    id: 3,
    name: 'Звонок клиенту',
    description: 'Обсудить условия сотрудничества',
    status: 'completed',
    priority: 3,
    due_date: '2024-01-25',
    responsible: [2],
    assigned_to_name: 'Иван Петров',
    stage: 3,
    stage_name: 'Завершено',
    created_at: '2024-01-18',
  },
];

const mockStages = [
  { id: 1, name: 'В работе', order: 1 },
  { id: 2, name: 'На проверке', order: 2 },
  { id: 3, name: 'Завершено', order: 3 },
];

const mockUsers = [
  { id: 2, username: 'Иван Петров', email: 'ivanov@example.com' },
  { id: 3, username: 'Мария Смирнова', email: 'smirnova@example.com' },
];

describe('TasksList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rbac.canWrite.mockReturnValue(true);
    api.getTasks.mockResolvedValue({
      results: mockTasks,
      count: 3,
    });
    api.getTaskStages.mockResolvedValue({
      results: mockStages,
    });
    api.getUsers.mockResolvedValue({
      results: mockUsers,
    });
    api.deleteTask.mockResolvedValue({});
    api.updateTask.mockResolvedValue({});
  });

  it('renders tasks list with data', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Задачи')).toBeInTheDocument();
    });

    expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    expect(screen.getByText('Согласовать договор')).toBeInTheDocument();
    expect(screen.getByText('Звонок клиенту')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    api.getTasks.mockImplementation(() => new Promise(() => {}));
    render(<TasksList />);

    await waitFor(() => {
      expect(api.getTaskStages).toHaveBeenCalledWith({ page_size: 200 });
      expect(api.getUsers).toHaveBeenCalledWith({ page_size: 200 });
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Поиск/);
    fireEvent.change(searchInput, { target: { value: 'презентацию' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(api.getTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'презентацию',
        })
      );
    });
  });

  it('navigates to create new task', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Создать задачу')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /создать задачу/i });
    fireEvent.click(createButton);

    expect(router.navigate).toHaveBeenCalledWith('/tasks/new');
  });

  it('navigates to task detail on view action', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    const viewButton = screen.getAllByText('Просмотр')[0];
    fireEvent.click(viewButton);
    expect(router.navigate).toHaveBeenCalledWith('/tasks/1');
  });

  it('navigates to task edit on edit action', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    const editButton = screen.getAllByRole('button', { name: /редактировать/i })[0];
    fireEvent.click(editButton);
    expect(router.navigate).toHaveBeenCalledWith('/tasks/1/edit');
  });

  it('handles task deletion', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    api.getTasks.mockResolvedValueOnce({
      results: mockTasks.slice(1),
      count: 2,
    });

    const deleteButton = screen.getAllByRole('button', { name: /удалить/i })[0];

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^да$/i }));
    });

    await waitFor(() => {
      expect(api.deleteTask).toHaveBeenCalledWith(1);
    });
  });

  it('handles pagination', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });

  it('renders completion checkboxes for task rows', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(1);
  });

  it('displays task stage badges', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/В работе|На проверке|Завершено/i).length).toBeGreaterThan(0);
  });

  it('handles error when fetching tasks', async () => {
    api.getTasks.mockRejectedValue(new Error('API Error'));

    render(<TasksList />);

    await waitFor(() => {
      expect(api.getTasks).toHaveBeenCalled();
    });

    // Should show empty state or error
    await waitFor(() => {
      expect(screen.queryByText('Подготовить презентацию')).not.toBeInTheDocument();
    });
  });

  it('handles error when loading stages', async () => {
    api.getTaskStages.mockRejectedValue(new Error('API Error'));

    render(<TasksList />);

    await waitFor(() => {
      expect(api.getTaskStages).toHaveBeenCalled();
    });

    // Tasks should still load even if stages fail
    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });
  });

  it('loads reference data on mount', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(api.getTaskStages).toHaveBeenCalledWith({ page_size: 200 });
      expect(api.getUsers).toHaveBeenCalledWith({ page_size: 200 });
    });
  });

  it('handles bulk selection', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    // Check if checkboxes are present
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);

    // Select first task
    if (checkboxes.length > 1) {
      fireEvent.click(checkboxes[1]);
    }
  });

  it('displays due dates correctly', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getByText(/15\.02\.2024/)).toBeInTheDocument();
    expect(screen.getByText(/20\.02\.2024/)).toBeInTheDocument();
  });

  it('displays assigned user information', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    // Assigned user names should be visible
    expect(screen.getAllByText('Иван Петров').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Мария Смирнова').length).toBeGreaterThan(0);
  });
});
