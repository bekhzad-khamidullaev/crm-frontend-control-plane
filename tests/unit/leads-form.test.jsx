import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeadForm from '../../src/modules/leads/LeadForm';
import * as client from '../../src/lib/api/client';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/client');
vi.mock('../../src/router');
vi.mock('../../src/components/ui-ReferenceSelect', () => ({
  default: ({ value, onChange, placeholder }) => (
    <select
      data-testid="reference-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder}
    >
      <option value="">Выберите</option>
      <option value="1">Опция 1</option>
      <option value="2">Опция 2</option>
    </select>
  ),
}));

const mockLead = {
  id: 1,
  first_name: 'Иван',
  last_name: 'Иванов',
  email: 'ivan@example.com',
  phone: '+7 999 123-45-67',
  company: 'ООО "Технологии"',
  position: 'Директор',
  stage: '1',
  source: '1',
  description: 'Тестовое описание',
};

describe('LeadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form', () => {
    render(<LeadForm />);
    
    expect(screen.getByText('Создать новый лид')).toBeInTheDocument();
    expect(screen.getByLabelText('Имя')).toBeInTheDocument();
    expect(screen.getByLabelText('Фамилия')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Телефон')).toBeInTheDocument();
  });

  it('renders edit form with data', async () => {
    client.getLead.mockResolvedValue(mockLead);
    
    render(<LeadForm id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Редактировать лид')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Иван')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Иванов')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ivan@example.com')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LeadForm />);
    
    const submitButton = screen.getByText('Создать');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Введите имя')).toBeInTheDocument();
      expect(screen.getByText('Введите фамилию')).toBeInTheDocument();
      expect(screen.getByText('Введите email')).toBeInTheDocument();
      expect(screen.getByText('Введите телефон')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<LeadForm />);
    
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('Некорректный email')).toBeInTheDocument();
    });
  });

  it('creates new lead', async () => {
    client.createLead.mockResolvedValue({ id: 1 });
    
    render(<LeadForm />);
    
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Иван' } });
    fireEvent.change(screen.getByLabelText('Фамилия'), { target: { value: 'Иванов' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ivan@example.com' } });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+7 999 123-45-67' } });
    
    // Select stage and source
    const stageSelects = screen.getAllByTestId('reference-select');
    fireEvent.change(stageSelects[0], { target: { value: '1' } });
    fireEvent.change(stageSelects[1], { target: { value: '1' } });

    const submitButton = screen.getByText('Создать');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(client.createLead).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Иван',
          last_name: 'Иванов',
          email: 'ivan@example.com',
          phone: '+7 999 123-45-67',
        })
      );
    });

    expect(router.navigate).toHaveBeenCalledWith('/leads');
  });

  it('updates existing lead', async () => {
    client.getLead.mockResolvedValue(mockLead);
    client.updateLead.mockResolvedValue({ id: 1 });
    
    render(<LeadForm id={1} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Иван')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Петр' } });
    
    const submitButton = screen.getByText('Обновить');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(client.updateLead).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          first_name: 'Петр',
        })
      );
    });

    expect(router.navigate).toHaveBeenCalledWith('/leads');
  });

  it('handles API error on create', async () => {
    client.createLead.mockRejectedValue(new Error('API Error'));
    
    render(<LeadForm />);
    
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Иван' } });
    fireEvent.change(screen.getByLabelText('Фамилия'), { target: { value: 'Иванов' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ivan@example.com' } });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+7 999 123-45-67' } });
    
    const stageSelects = screen.getAllByTestId('reference-select');
    fireEvent.change(stageSelects[0], { target: { value: '1' } });
    fireEvent.change(stageSelects[1], { target: { value: '1' } });

    const submitButton = screen.getByText('Создать');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(client.createLead).toHaveBeenCalled();
    });

    // Should show error message (via Ant Design message component)
  });

  it('handles API error on load', async () => {
    client.getLead.mockRejectedValue(new Error('API Error'));
    
    render(<LeadForm id={1} />);
    
    await waitFor(() => {
      expect(client.getLead).toHaveBeenCalled();
    });

    // Should show error and not display mock data
    expect(screen.queryByDisplayValue('Иван')).not.toBeInTheDocument();
  });

  it('navigates back on cancel', async () => {
    render(<LeadForm />);
    
    const cancelButton = screen.getByText('Отмена');
    fireEvent.click(cancelButton);

    expect(router.navigate).toHaveBeenCalledWith('/leads');
  });

  it('navigates back on back button', async () => {
    render(<LeadForm />);
    
    const backButton = screen.getByText('Назад');
    fireEvent.click(backButton);

    expect(router.navigate).toHaveBeenCalledWith('/leads');
  });
});
