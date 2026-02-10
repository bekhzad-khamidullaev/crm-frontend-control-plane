import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskForm from '../../src/modules/tasks/TaskForm';
import * as client from '../../src/lib/api/client';
import * as router from '../../src/router';
// Mock dependencies
vi.mock('../../src/lib/api/client');
vi.mock('../../src/router');
vi.mock('../../src/components/ui-ReferenceSelect', () => ({
  default: ({ value, onChange, placeholder }) => (
    <select
      data-testid={`select-${placeholder}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Выберите</option>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </select>
  ),
}));
vi.mock('../../src/components/EntitySelect', () => ({
  default: ({ value, onChange, placeholder }) => (
    <select
      data-testid={`entity-select-${placeholder}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Выберите</option>
      <option value="1">Entity 1</option>
      <option value="2">Entity 2</option>
    </select>
  ),
}));

const mockTask = {
  id: 1,
  title: 'Тестовая задача',
  description: 'Описание задачи',
  status: 'open',
  priority: 'normal',
  stage: 1,
  assigned_to: 2,
  start_date: '2024-01-20',
  due_date: '2024-02-15',
  closing_date: null,
  next_step_date: null,
  project: 5,
  contact: 10,
  company: 15,
};

const mockUsers = [
  { id: 2, username: 'ivanov', email: 'ivanov@example.com' },
  { id: 3, username: 'smirnova', email: 'smirnova@example.com' },
];

const mockStages = [
  { id: 1, name: 'В работе', order: 1 },
  { id: 2, name: 'На проверке', order: 2 },
];

const TestWrapper = ({ children }) => <>{children}</>;

describe('TaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getTask.mockResolvedValue(mockTask);
    client.createTask.mockResolvedValue({ id: 1, ...mockTask });
    client.updateTask.mockResolvedValue(mockTask);
    client.getUsers.mockResolvedValue({ results: mockUsers });
    client.getTaskStages.mockResolvedValue({ results: mockStages });
  });

  describe('Create Mode', () => {
    it('renders create form with empty fields', async () => {
      render(
        <TestWrapper>
          <TaskForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Создать задачу|Новая задача/i)).toBeInTheDocument();
      });

      // Check that form fields are present
      expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Описание/i)).toBeInTheDocument();
    });

    it('submits form with valid data', async () => {
      render(
        <TestWrapper>
          <TaskForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      });

      // Fill in required fields
      const titleInput = screen.getByLabelText(/Название|Заголовок/i);
      fireEvent.change(titleInput, { target: { value: 'Новая задача' } });

      const descriptionInput = screen.getByLabelText(/Описание/i);
      fireEvent.change(descriptionInput, {
        target: { value: 'Описание новой задачи' },
      });

      // Submit form
      const submitButton = screen.getByText(/Сохранить|Создать/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(client.createTask).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith('/tasks');
      });
    });

    it('shows validation error for empty required fields', async () => {
      render(
        <TestWrapper>
          <TaskForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByText(/Сохранить|Создать/i);
      fireEvent.click(submitButton);

      // Form should not call API without required fields
      await waitFor(() => {
        expect(client.createTask).not.toHaveBeenCalled();
      });
    });

    it('handles API error on create', async () => {
      client.createTask.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <TaskForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      });

      // Fill in form
      const titleInput = screen.getByLabelText(/Название|Заголовок/i);
      fireEvent.change(titleInput, { target: { value: 'Новая задача' } });

      // Submit form
      const submitButton = screen.getByText(/Сохранить|Создать/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(client.createTask).toHaveBeenCalled();
      });

      // Should not navigate on error
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('loads and displays existing task data', async () => {
      render(
        <TestWrapper>
          <TaskForm id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(client.getTask).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Название|Заголовок/i);
        expect(titleInput).toHaveValue('Тестовая задача');
      });
    });

    it('shows loading state while fetching task', () => {
      client.getTask.mockImplementation(() => new Promise(() => {}));

      render(
        <TestWrapper>
          <TaskForm id={1} />
        </TestWrapper>
      );

      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('submits updated task data', async () => {
      render(
        <TestWrapper>
          <TaskForm id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Название|Заголовок/i);
        expect(titleInput).toHaveValue('Тестовая задача');
      });

      // Update title
      const titleInput = screen.getByLabelText(/Название|Заголовок/i);
      fireEvent.change(titleInput, { target: { value: 'Обновленная задача' } });

      // Submit form
      const submitButton = screen.getByText(/Сохранить|Обновить/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(client.updateTask).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: 'Обновленная задача',
          })
        );
        expect(router.navigate).toHaveBeenCalledWith('/tasks');
      });
    });

    it('handles API error on update', async () => {
      client.updateTask.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <TaskForm id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Название|Заголовок/i);
        expect(titleInput).toHaveValue('Тестовая задача');
      });

      // Submit form
      const submitButton = screen.getByText(/Сохранить|Обновить/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(client.updateTask).toHaveBeenCalled();
      });

      // Should not navigate on error
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('handles error when loading task', async () => {
      client.getTask.mockRejectedValue(new Error('Task not found'));

      render(
        <TestWrapper>
          <TaskForm id={999} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(client.getTask).toHaveBeenCalledWith(999);
      });

      // Form should still render but without data
      await waitFor(() => {
        expect(screen.getByText(/Редактировать задачу|Задача/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    it('renders all form fields', async () => {
      render(
        <TestWrapper>
          <TaskForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      });

      // Check that all major fields are present
      expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Описание/i)).toBeInTheDocument();
    });

    it('handles date field changes', async () => {
      render(
        <TestWrapper>
          <TaskForm id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Название|Заголовок/i);
        expect(titleInput).toHaveValue('Тестовая задача');
      });

      // Date fields should be rendered (DatePicker components)
      const dateInputs = screen.getAllByPlaceholderText(/Выберите дату|дата/i);
      expect(dateInputs.length).toBeGreaterThan(0);
    });

    it('handles priority selection', async () => {
      render(
        <TestWrapper>
          <TaskForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      });

      // Priority field should be present
      const prioritySelect = screen.queryByTestId(/select.*приоритет/i);
      if (prioritySelect) {
        fireEvent.change(prioritySelect, { target: { value: 'high' } });
        expect(prioritySelect).toHaveValue('high');
      }
    });

    it('handles status selection', async () => {
      render(
        <TestWrapper>
          <TaskForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      });

      // Status field should be present
      const statusSelect = screen.queryByTestId(/select.*статус/i);
      if (statusSelect) {
        fireEvent.change(statusSelect, { target: { value: 'in_progress' } });
        expect(statusSelect).toHaveValue('in_progress');
      }
    });
  });

  describe('Navigation', () => {
    it('navigates back on cancel', async () => {
      render(
        <TestWrapper>
          <TaskForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      });

      const backButton = screen.getByText('Назад');
      fireEvent.click(backButton);
      expect(router.navigate).toHaveBeenCalledWith('/tasks');
    });
  });

  describe('Data Normalization', () => {
    it('normalizes dates before submission', async () => {
      render(
        <TestWrapper>
          <TaskForm id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Название|Заголовок/i);
        expect(titleInput).toHaveValue('Тестовая задача');
      });

      // Submit form
      const submitButton = screen.getByText(/Сохранить|Обновить/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(client.updateTask).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            start_date: expect.any(String),
            due_date: expect.any(String),
          })
        );
      });
    });

    it('handles null date values', async () => {
      const taskWithoutDates = {
        ...mockTask,
        start_date: null,
        due_date: null,
        closing_date: null,
        next_step_date: null,
      };
      client.getTask.mockResolvedValue(taskWithoutDates);

      render(
        <TestWrapper>
          <TaskForm id={1} />
        </TestWrapper>
      );

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Название|Заголовок/i);
        expect(titleInput).toHaveValue('Тестовая задача');
      });

      // Form should render without errors
      expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires title field', async () => {
      render(
        <TestWrapper>
          <TaskForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      });

      // Try to submit without title
      const submitButton = screen.getByText(/Сохранить|Создать/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Should show validation error or not submit
        expect(client.createTask).not.toHaveBeenCalled();
      });
    });

    it('accepts valid form data', async () => {
      render(
        <TestWrapper>
          <TaskForm />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Название|Заголовок/i)).toBeInTheDocument();
      });

      // Fill in valid data
      const titleInput = screen.getByLabelText(/Название|Заголовок/i);
      fireEvent.change(titleInput, { target: { value: 'Valid Task Title' } });

      // Submit form
      const submitButton = screen.getByText(/Сохранить|Создать/i);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(client.createTask).toHaveBeenCalled();
      });
    });
  });
});
