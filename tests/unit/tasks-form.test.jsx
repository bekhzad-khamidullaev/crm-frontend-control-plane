import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../src/lib/api';
import TaskForm from '../../src/modules/tasks/TaskForm';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api', () => ({
  getTask: vi.fn(),
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  getUsers: vi.fn(),
  getUser: vi.fn(),
  getTaskStages: vi.fn(),
  getProjects: vi.fn(),
  getProject: vi.fn(),
}));

vi.mock('../../src/router');

vi.mock('../../src/components/ui-ReferenceSelect', () => ({
  default: ({ value, onChange, placeholder, id }) => (
    <select
      id={id}
      data-testid={`select-${placeholder}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Выберите</option>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </select>
  ),
}));

vi.mock('../../src/components/EntitySelect', () => ({
  default: ({ value, onChange, placeholder, mode }) => (
    <select
      data-testid={`entity-select-${placeholder}`}
      value={mode === 'multiple' ? (value || []) : (value || '')}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Выберите</option>
      <option value="1">Entity 1</option>
      <option value="2">Entity 2</option>
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

const mockTask = {
  id: 1,
  name: 'Тестовая задача',
  description: 'Описание задачи',
  note: 'Заметка',
  status: 'open',
  priority: 1,
  stage: 1,
  start_date: '2024-01-20',
  due_date: '2024-02-15',
  closing_date: null,
  next_step: 'Следующий шаг',
  next_step_date: '2024-02-01',
  project: 5,
  owner: 2,
  responsible: [2],
  active: true,
};

const mockUsers = [
  { id: 2, name: 'Иван Иванов', username: 'ivanov' },
];

const mockStages = [
  { id: 1, name: 'В работе' },
];

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTask.mockResolvedValue(mockTask);
    api.createTask.mockResolvedValue({ id: 1, ...mockTask });
    api.updateTask.mockResolvedValue(mockTask);
    api.getUsers.mockResolvedValue({ results: mockUsers });
    api.getTaskStages.mockResolvedValue({ results: mockStages });
    api.getProjects.mockResolvedValue({ results: [] });
    api.getTasks.mockResolvedValue({ results: [] });
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', async () => {
      render(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByText('Создать новую задачу')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Название задачи/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Описание/i)).toBeInTheDocument();
    });

    it('submits form with valid data', async () => {
      render(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Название задачи/i)).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/Название задачи/i), { target: { value: 'Новая задача' } });
      fireEvent.change(screen.getByLabelText(/Описание/i), { target: { value: 'Описание новой задачи' } });
      fireEvent.change(screen.getByLabelText(/Следующий шаг/i), { target: { value: 'Шаг 1' } });
      // Next step date is required
      const nextStepDateInput = screen.getByLabelText(/Дата следующего шага/i);
      fireEvent.change(nextStepDateInput, { target: { value: '2024-03-01' } });

      // Need to select stage
      const stageSelect = screen.getByLabelText(/Этап/i);
      fireEvent.change(stageSelect, { target: { value: '1' } });

      const submitButton = screen.getByRole('button', { name: /Создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.createTask).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith('/tasks');
      });
    });

    it('shows validation error for empty required fields', async () => {
      render(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Название задачи/i)).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Создать/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Введите название')).toBeInTheDocument();
      });
      expect(api.createTask).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('loads and displays existing task data', async () => {
      render(<TaskForm id={1} />);

      await waitFor(() => {
        expect(api.getTask).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/Название задачи/i)).toHaveValue('Тестовая задача');
        expect(screen.getByLabelText(/Описание/i)).toHaveValue('Описание задачи');
      });
    });

    it('submits updated task data', async () => {
      render(<TaskForm id={1} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Название задачи/i)).toHaveValue('Тестовая задача');
      });

      fireEvent.change(screen.getByLabelText(/Название задачи/i), { target: { value: 'Обновленная задача' } });

      const submitButton = screen.getByRole('button', { name: /Обновить/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.updateTask).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: 'Обновленная задача',
          })
        );
        expect(router.navigate).toHaveBeenCalledWith('/tasks');
      });
    });
  });

  describe('Form Fields', () => {
    it('handles priority selection', async () => {
      render(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Название задачи/i)).toBeInTheDocument();
      });

      const priorityInput = screen.getByLabelText(/Приоритет/i);
      fireEvent.change(priorityInput, { target: { value: '2' } });
      expect(priorityInput).toHaveValue(2);
    });

    it('handles status switches', async () => {
      render(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Название задачи/i)).toBeInTheDocument();
      });

      // Switches usually don't have label association that testing-library likes unless role is used
      expect(screen.getByLabelText(/Активна/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Напоминать/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates back on cancel', async () => {
      render(<TaskForm />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Название задачи/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Отмена');
      fireEvent.click(cancelButton);
      expect(router.navigate).toHaveBeenCalledWith('/tasks');
    });
  });

  describe('Data Normalization', () => {
    it('handles null date values', async () => {
      const taskWithoutDates = {
        ...mockTask,
        start_date: null,
        due_date: null,
        closing_date: null,
        next_step_date: '2024-02-01', // This is required in schema
      };
      api.getTask.mockResolvedValue(taskWithoutDates);

      render(<TaskForm id={1} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Название задачи/i)).toHaveValue('Тестовая задача');
      });

      expect(screen.getByLabelText(/Название задачи/i)).toBeInTheDocument();
    });
  });
});
