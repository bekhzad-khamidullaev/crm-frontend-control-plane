import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../../src/lib/api';
import * as clientApi from '../../src/lib/api/client';
import * as paymentsApi from '../../src/lib/api/payments';
import * as rbac from '../../src/lib/rbac';
import PaymentForm from '../../src/modules/payments/PaymentForm';
import TaskForm from '../../src/modules/tasks/TaskForm';

vi.mock('../../src/lib/rbac', () => ({
  canWrite: vi.fn(),
}));

vi.mock('../../src/router', () => ({
  navigate: vi.fn(),
}));

vi.mock('../../src/lib/api/payments', () => ({
  createPayment: vi.fn(),
  getPayment: vi.fn(),
  updatePayment: vi.fn(),
}));

vi.mock('../../src/lib/api/client', () => ({
  getDeals: vi.fn(),
  getDeal: vi.fn(),
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

vi.mock('../../src/components/ReferenceSelect', () => ({
  default: ({ value, onChange, placeholder, id, type, mode }) => (
    <select
      id={id}
      data-testid={`reference-${type || placeholder || 'select'}`}
      multiple={mode === 'multiple'}
      value={mode === 'multiple' ? (value || []) : (value || '')}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Выберите</option>
      <option value="r">Получен</option>
      <option value="1">Этап 1</option>
    </select>
  ),
}));

vi.mock('../../src/components/EntitySelect', () => ({
  default: ({ value, onChange, placeholder, id, mode, 'data-testid': testId }) => (
    <select
      id={id}
      data-testid={testId || `entity-${placeholder || 'select'}`}
      multiple={mode === 'multiple'}
      value={mode === 'multiple' ? (value || []) : (value || '')}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Выберите</option>
      <option value="5">Entity 5</option>
      <option value="1">Entity 1</option>
    </select>
  ),
}));

describe('Form permissions integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clientApi.getDeals.mockResolvedValue({ results: [{ id: 5, name: 'Deal 5' }] });
    paymentsApi.createPayment.mockResolvedValue({ id: 1 });
    api.createTask.mockResolvedValue({ id: 1 });
  });

  describe('PaymentForm', () => {
    it('renders 403 and hides submit actions when user has no permission', () => {
      rbac.canWrite.mockReturnValue(false);

      render(<PaymentForm />);

      expect(screen.getByText('Недостаточно прав')).toBeInTheDocument();
      expect(screen.getByText('У вас нет прав для создания или редактирования платежей.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /создать|сохранить/i })).not.toBeInTheDocument();
      expect(paymentsApi.createPayment).not.toHaveBeenCalled();
      expect(paymentsApi.updatePayment).not.toHaveBeenCalled();
    });

  });

  describe('TaskForm', () => {
    it('renders 403 and does not expose submit controls without permission', () => {
      rbac.canWrite.mockReturnValue(false);

      render(<TaskForm />);

      expect(screen.getByText('Недостаточно прав')).toBeInTheDocument();
      expect(screen.getByText('У вас нет прав для создания или редактирования задач.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /создать|обновить/i })).not.toBeInTheDocument();
      expect(api.createTask).not.toHaveBeenCalled();
    });
  });
});
