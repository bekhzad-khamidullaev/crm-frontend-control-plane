import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContactsList from '../../src/modules/contacts/ContactsList';
import * as router from '../../src/router';

// ContactsList imports from src/lib/api (index), mock it there
vi.mock('../../src/lib/api', () => ({
  getContacts: vi.fn(),
  getCompanies: vi.fn(),
  deleteContact: vi.fn(),
  patchContact: vi.fn(),
}));
vi.mock('../../src/router');
vi.mock('../../src/lib/api/export');
vi.mock('../../src/modules/contacts/ContactsKPI', () => ({
  default: ({ contacts }) => <div data-testid="kpi">KPI: {contacts?.length} contacts</div>,
}));
vi.mock('../../src/components/CallButton', () => ({
  default: ({ phone, name }) => <button>Call {name} at {phone}</button>,
}));
vi.mock('../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  DropdownMenuLabel: ({ children }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

// Import the mocked module so we can configure mock return values
import * as api from '../../src/lib/api';

const mockContacts = [
  {
    id: 1,
    first_name: 'Анна',
    last_name: 'Смирнова',
    full_name: 'Анна Смирнова',
    email: 'anna@example.com',
    phone: '+7 999 111-22-33',
    company: 1,
    type: 'client',
    created_at: '2024-01-20',
  },
  {
    id: 2,
    first_name: 'Дмитрий',
    last_name: 'Козлов',
    full_name: 'Дмитрий Козлов',
    email: 'dmitry@example.com',
    phone: '+7 999 222-33-44',
    company: 2,
    type: 'partner',
    created_at: '2024-01-19',
  },
];

describe('ContactsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getContacts.mockResolvedValue({
      results: mockContacts,
      count: 2,
    });
    api.getCompanies.mockResolvedValue({ results: [], count: 0 });
  });

  it('renders contacts list with data', async () => {
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(api.getContacts).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getAllByText('Анна Смирнова')[0]).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    api.getContacts.mockImplementation(() => new Promise(() => {}));
    render(<ContactsList />);
    
    // Table renders even in loading state
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('handles search', async () => {
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(api.getContacts).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText(/Поиск/);
    fireEvent.change(searchInput, { target: { value: 'Анна' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(api.getContacts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Анна',
        }),
        expect.anything()
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

  it('renders list without KPI by default', async () => {
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(api.getContacts).toHaveBeenCalled();
    });

    expect(screen.queryByTestId('kpi')).not.toBeInTheDocument();
  });

  it('handles bulk delete selection', async () => {
    api.deleteContact.mockResolvedValue({});
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(api.getContacts).toHaveBeenCalled();
    });

    // Select checkboxes if present
    const checkboxes = screen.queryAllByRole('checkbox');
    if (checkboxes.length > 1) {
      fireEvent.click(checkboxes[1]);
    }
  });

  it('handles error when fetching contacts', async () => {
    api.getContacts.mockRejectedValue(new Error('API Error'));
    
    render(<ContactsList />);
    
    await waitFor(() => {
      expect(api.getContacts).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByText('Анна Смирнова')).not.toBeInTheDocument();
    });
  });
});
