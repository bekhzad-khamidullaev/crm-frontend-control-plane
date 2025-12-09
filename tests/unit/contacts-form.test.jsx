import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactForm from '../../src/modules/contacts/ContactForm';
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
      <option value="client">Клиент</option>
      <option value="partner">Партнер</option>
    </select>
  ),
}));

const mockContact = {
  id: 1,
  first_name: 'Анна',
  last_name: 'Смирнова',
  email: 'anna@example.com',
  phone: '+7 999 111-22-33',
  company: 'ООО "Альфа"',
  position: 'Менеджер',
  type: 'client',
  address: 'г. Москва, ул. Ленина, д. 1',
  website: 'https://example.com',
  notes: 'Постоянный клиент',
};

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form', () => {
    render(<ContactForm />);
    
    expect(screen.getByText('Создать новый контакт')).toBeInTheDocument();
    expect(screen.getByLabelText('Имя')).toBeInTheDocument();
    expect(screen.getByLabelText('Фамилия')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Телефон')).toBeInTheDocument();
  });

  it('renders edit form with data', async () => {
    client.getContact.mockResolvedValue(mockContact);
    
    render(<ContactForm id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Редактировать контакт')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Анна')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Смирнова')).toBeInTheDocument();
    expect(screen.getByDisplayValue('anna@example.com')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<ContactForm />);
    
    const submitButton = screen.getByText('Создать');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Введите имя')).toBeInTheDocument();
      expect(screen.getByText('Введите фамилию')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<ContactForm />);
    
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText('Некорректный email')).toBeInTheDocument();
    });
  });

  it('creates new contact', async () => {
    client.createContact.mockResolvedValue({ id: 1 });
    
    render(<ContactForm />);
    
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Анна' } });
    fireEvent.change(screen.getByLabelText('Фамилия'), { target: { value: 'Смирнова' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'anna@example.com' } });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+7 999 111-22-33' } });

    const submitButton = screen.getByText('Создать');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(client.createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Анна',
          last_name: 'Смирнова',
          email: 'anna@example.com',
          phone: '+7 999 111-22-33',
        })
      );
    });

    expect(router.navigate).toHaveBeenCalledWith('/contacts');
  });

  it('updates existing contact', async () => {
    client.getContact.mockResolvedValue(mockContact);
    client.updateContact.mockResolvedValue({ id: 1 });
    
    render(<ContactForm id={1} />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Анна')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Мария' } });
    
    const submitButton = screen.getByText('Обновить');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(client.updateContact).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          first_name: 'Мария',
        })
      );
    });

    expect(router.navigate).toHaveBeenCalledWith('/contacts');
  });

  it('handles API error on create', async () => {
    client.createContact.mockRejectedValue(new Error('API Error'));
    
    render(<ContactForm />);
    
    fireEvent.change(screen.getByLabelText('Имя'), { target: { value: 'Анна' } });
    fireEvent.change(screen.getByLabelText('Фамилия'), { target: { value: 'Смирнова' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'anna@example.com' } });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+7 999 111-22-33' } });

    const submitButton = screen.getByText('Создать');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(client.createContact).toHaveBeenCalled();
    });
  });

  it('handles API error on load', async () => {
    client.getContact.mockRejectedValue(new Error('API Error'));
    
    render(<ContactForm id={1} />);
    
    await waitFor(() => {
      expect(client.getContact).toHaveBeenCalled();
    });

    // Should not display mock data
    expect(screen.queryByDisplayValue('Анна')).not.toBeInTheDocument();
  });

  it('navigates back on cancel', async () => {
    render(<ContactForm />);
    
    const cancelButton = screen.getByText('Отмена');
    fireEvent.click(cancelButton);

    expect(router.navigate).toHaveBeenCalledWith('/contacts');
  });
});
