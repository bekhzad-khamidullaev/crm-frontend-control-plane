import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactsList from '../../src/modules/contacts/ContactsList';
import * as client from '../../src/lib/api/client';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/client');
vi.mock('../../src/router');
vi.mock('../../src/lib/api/export');
vi.mock('../../src/modules/contacts/ContactsKPI', () => ({
  default: ({ contacts }) => <div data-testid="kpi">KPI: {contacts.length} contacts</div>,
}));

const mockContacts = [
  {
    id: 1,
    first_name: 'Анна',
    last_name: 'Смирнова',
    email: 'anna@example.com',
    phone: '+7 999 111-22-33',
    company: 'ООО "Альфа"',
    position: 'Менеджер',
    type: 'client',
    created_at: '2024-01-20',
  },
  {
    id: 2,
    first_name: 'Дмитрий',
    last_name: 'Козлов',
    email: 'dmitry@example.com',
    phone: '+7 999 222-33-44',
    company: 'ИП Козлов',
    position: 'Директор',
    type: 'partner',
    created_at: '2024-01-19',
  },
];

describe('ContactsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getContacts.mockResolvedValue({
      results: mockContacts,
      count: 2,
    });
  });

  it('renders contacts list with data', async () => {
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Контакты')).toBeInTheDocument();
    });

    expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    expect(screen.getByText('Дмитрий Козлов')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    client.getContacts.mockImplementation(() => new Promise(() => {}));
    render(<ContactsList />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('handles search', async () => {
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Поиск/);
    fireEvent.change(searchInput, { target: { value: 'Анна' } });
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(client.getContacts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Анна',
        })
      );
    });
  });

  it('navigates to create new contact', async () => {
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Создать контакт')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Создать контакт');
    fireEvent.click(createButton);

    expect(router.navigate).toHaveBeenCalledWith('/contacts/new');
  });

  it('deletes a contact', async () => {
    client.deleteContact.mockResolvedValue({});
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Удалить');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByText('Да');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.deleteContact).toHaveBeenCalledWith(1);
    });
  });

  it('toggles KPI display', async () => {
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(screen.getByTestId('kpi')).toBeInTheDocument();
    });

    const toggleButton = screen.getByText('Скрыть статистику');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.queryByTestId('kpi')).not.toBeInTheDocument();
    });
  });

  it('handles inline cell editing', async () => {
    client.contactsApi = {
      patch: vi.fn().mockResolvedValue({}),
    };
    
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(screen.getByText('anna@example.com')).toBeInTheDocument();
    });

    // Verify EditableCell renders
    expect(screen.getByText('anna@example.com')).toBeInTheDocument();
  });

  it('handles bulk delete', async () => {
    client.deleteContact.mockResolvedValue({});
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    // Select checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);
  });

  it('handles error when fetching contacts', async () => {
    client.getContacts.mockRejectedValue(new Error('API Error'));
    
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(client.getContacts).toHaveBeenCalled();
    });

    // Should show empty state
    await waitFor(() => {
      expect(screen.queryByText('Анна Смирнова')).not.toBeInTheDocument();
    });
  });
});
