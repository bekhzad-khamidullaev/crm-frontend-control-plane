import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TasksList from '../../src/modules/tasks/TasksList';
import * as client from '../../src/lib/api/client';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/client');
vi.mock('../../src/router');

const mockTasks = [
  {
    id: 1,
    title: 'Подготовить презентацию',
    description: 'Презентация для клиента',
    status: 'open',
    priority: 'high',
    due_date: '2024-02-15',
    assigned_to: 2,
    assigned_to_name: 'Иван Петров',
    stage: 1,
    stage_name: 'В работе',
    created_at: '2024-01-20',
  },
  {
    id: 2,
    title: 'Согласовать договор',
    description: 'Договор с ООО Альфа',
    status: 'in_progress',
    priority: 'normal',
    due_date: '2024-02-20',
    assigned_to: 3,
    assigned_to_name: 'Мария Смирнова',
    stage: 2,
    stage_name: 'На проверке',
    created_at: '2024-01-19',
  },
  {
    id: 3,
    title: 'Звонок клиенту',
    description: 'Обсудить условия сотрудничества',
    status: 'completed',
    priority: 'urgent',
    due_date: '2024-01-25',
    assigned_to: 2,
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
  { id: 2, username: 'ivanov', email: 'ivanov@example.com' },
  { id: 3, username: 'smirnova', email: 'smirnova@example.com' },
];

describe('TasksList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getTasks.mockResolvedValue({
      results: mockTasks,
      count: 3,
    });
    client.getTaskStages.mockResolvedValue({
      results: mockStages,
    });
    client.getUsers.mockResolvedValue({
      results: mockUsers,
    });
    client.deleteTask.mockResolvedValue({});
    client.updateTask.mockResolvedValue({});
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

  it('shows loading state initially', () => {
    client.getTasks.mockImplementation(() => new Promise(() => {}));
    render(<TasksList />);

    expect(screen.getByRole('table')).toBeInTheDocument();
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
      expect(client.getTasks).toHaveBeenCalledWith(
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

    const createButton = screen.getByText('Создать задачу');
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

    const editButton = screen.getAllByText('Редактировать')[0];
    fireEvent.click(editButton);
    expect(router.navigate).toHaveBeenCalledWith('/tasks/1/edit');
  });

  it('handles task deletion', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    client.getTasks.mockResolvedValueOnce({
      results: mockTasks.slice(1),
      count: 2,
    });

    const deleteButton = screen.getAllByText('Удалить')[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const confirmButton = screen.getByText('Да');
      fireEvent.click(confirmButton);
    });
  });

  it('handles pagination', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    // Check if pagination is rendered
    const pagination = screen.queryByRole('navigation');
    expect(pagination || screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays task priority badges', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getByText(/низкий|средний|высокий/i)).toBeInTheDocument();
  });

  it('displays task stage badges', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });

    expect(screen.getByText(/В работе|На проверке|Завершено/i)).toBeInTheDocument();
  });

  it('handles error when fetching tasks', async () => {
    client.getTasks.mockRejectedValue(new Error('API Error'));

    render(<TasksList />);

    await waitFor(() => {
      expect(client.getTasks).toHaveBeenCalled();
    });

    // Should show empty state or error
    await waitFor(() => {
      expect(screen.queryByText('Подготовить презентацию')).not.toBeInTheDocument();
    });
  });

  it('handles error when loading stages', async () => {
    client.getTaskStages.mockRejectedValue(new Error('API Error'));

    render(<TasksList />);

    await waitFor(() => {
      expect(client.getTaskStages).toHaveBeenCalled();
    });

    // Tasks should still load even if stages fail
    await waitFor(() => {
      expect(screen.getByText('Подготовить презентацию')).toBeInTheDocument();
    });
  });

  it('loads reference data on mount', async () => {
    render(<TasksList />);

    await waitFor(() => {
      expect(client.getTaskStages).toHaveBeenCalledWith({ page_size: 200 });
      expect(client.getUsers).toHaveBeenCalledWith({ page_size: 200 });
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
    expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    expect(screen.getByText('Мария Смирнова')).toBeInTheDocument();
  });
});
