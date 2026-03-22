import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../src/lib/api';
import * as rbac from '../../src/lib/rbac';
import TaskForm from '../../src/modules/tasks/TaskForm';

vi.mock('../../src/lib/rbac', () => ({
  canWrite: vi.fn(),
}));

vi.mock('../../src/lib/api', () => ({
  createTask: vi.fn(),
  getProject: vi.fn(),
  getProjects: vi.fn(),
  getTask: vi.fn(),
  getTasks: vi.fn(),
  getUser: vi.fn(),
  getUsers: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock('../../src/router', () => ({
  navigate: vi.fn(),
}));

vi.mock('../../src/components/ReferenceSelect', () => ({
  default: ({ value, onChange, placeholder, id, type, mode }) => (
    <select
      id={id}
      data-testid={`reference-${type || 'default'}`}
      multiple={mode === 'multiple'}
      value={mode === 'multiple' ? (value || []) : (value || '')}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder || 'Выберите'}</option>
      <option value="1">Option 1</option>
    </select>
  ),
}));

vi.mock('../../src/components/EntitySelect', () => ({
  default: ({ value, onChange, placeholder, mode }) => (
    <select
      data-testid={`entity-${placeholder || 'select'}`}
      multiple={mode === 'multiple'}
      value={mode === 'multiple' ? (value || []) : (value || '')}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Выберите</option>
      <option value="1">Entity 1</option>
    </select>
  ),
}));

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rbac.canWrite.mockReturnValue(true);
    api.getTask.mockResolvedValue({
      id: 1,
      name: 'Тестовая задача',
      description: 'Описание задачи',
      stage: 1,
      next_step: 'Следующий шаг',
      next_step_date: '2024-02-01',
      active: true,
    });
  });

  it('renders create form fields', () => {
    render(<TaskForm />);

    expect(screen.getByPlaceholderText('Подготовить коммерческое предложение')).toBeInTheDocument();
    expect(screen.getByTestId('reference-task-stages')).toBeInTheDocument();
    expect(screen.getByText(/создать новую задачу/i)).toBeInTheDocument();
  });

  it('loads task in edit mode', async () => {
    render(<TaskForm id={1} />);

    await waitFor(() => {
      expect(api.getTask).toHaveBeenCalledWith(1);
    });
  });

  it('renders permission denied state without write permission', () => {
    rbac.canWrite.mockReturnValue(false);

    render(<TaskForm />);

    expect(screen.getByText('Недостаточно прав')).toBeInTheDocument();
    expect(screen.getByText('У вас нет прав для создания или редактирования задач.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /создать|обновить/i })).not.toBeInTheDocument();
  });
});
