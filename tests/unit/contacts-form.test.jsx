import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../../src/lib/api/client';
import ContactForm from '../../src/modules/contacts/ContactForm';
import * as router from '../../src/router';

// Mock dependencies with factories
vi.mock('../../src/lib/api/client', () => ({
  getContact: vi.fn(),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  getCompanies: vi.fn(),
  getCompany: vi.fn(),
  getUsers: vi.fn(),
  getUser: vi.fn(),
  contactsApi: { patch: vi.fn() },
}));
vi.mock('../../src/router');
vi.mock('../../src/components/ui-ReferenceSelect', () => ({
  default: ({ value, onChange, placeholder }) => (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder}
    >
      <option value="">Выберите</option>
    </select>
  ),
}));
vi.mock('../../src/components/EntitySelect', () => ({
  default: ({ value, onChange, placeholder }) => (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder}
    >
      <option value="">Выберите</option>
    </select>
  ),
}));
vi.mock('../../src/components/ui-DatePicker', () => ({
  DatePicker: ({ value, onChange }) => (
    <input
      type="date"
      value={value ? value.format('YYYY-MM-DD') : ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const mockContact = {
  id: 1,
  first_name: 'Анна',
  last_name: 'Смирнова',
  email: 'anna@example.com',
  phone: '+7 999 111-22-33',
  title: 'Менеджер',
};

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form', () => {
    render(<ContactForm />);
    
    expect(screen.getByText('Создать новый контакт')).toBeInTheDocument();
    // Labels have asterisks, use regex — but Email exists twice (Email * and Доп. Email)
    expect(screen.getByLabelText(/^Имя/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email \*/)).toBeInTheDocument();
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
    });
  });

  it('creates new contact', async () => {
    client.createContact.mockResolvedValue({ id: 1 });
    
    render(<ContactForm />);
    
    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'Анна' } });
    fireEvent.change(screen.getByLabelText(/Фамилия/), { target: { value: 'Смирнова' } });
    fireEvent.change(screen.getByLabelText(/Email \*/), { target: { value: 'anna@example.com' } });

    const submitButton = screen.getByText('Создать');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(client.createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Анна',
          email: 'anna@example.com',
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

    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'Мария' } });
    
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
    
    fireEvent.change(screen.getByLabelText(/Имя/), { target: { value: 'Анна' } });
    fireEvent.change(screen.getByLabelText(/Email \*/), { target: { value: 'anna@example.com' } });

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

    expect(screen.queryByDisplayValue('Анна')).not.toBeInTheDocument();
  });

  it('navigates back on cancel', () => {
    render(<ContactForm />);
    
    const cancelButton = screen.getByText('Отмена');
    fireEvent.click(cancelButton);

    expect(router.navigate).toHaveBeenCalledWith('/contacts');
  });
});
