import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../../src/lib/api/client';
import LeadsList from '../../src/modules/leads/LeadsList';

// Mock dependencies
vi.mock('../../src/lib/api/client');
vi.mock('../../src/router');
vi.mock('../../src/lib/api/reference', () => ({
  getLeadSources: vi.fn().mockResolvedValue({ results: [] }),
}));
vi.mock('../../src/modules/leads/LeadsKanban', () => ({
  default: () => <div data-testid="kanban">Kanban View</div>,
}));

// Mock Shadcn UI components that use Portals or are complex in JSDOM
vi.mock('../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }) => (
    <button data-testid="dropdown-item" onClick={onClick}>{children}</button>
  ),
  DropdownMenuLabel: ({ children }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('../../src/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }) => <div>{children}</div>,
  AlertDialogCancel: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  AlertDialogAction: ({ children, onClick }) => <button data-testid="alert-dialog-action" onClick={onClick}>{children}</button>,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  MoreHorizontal: () => <span data-testid="more-icon" />,
  Plus: () => <span data-testid="plus-icon" />,
  Search: () => <span data-testid="search-icon" />,
  Filter: () => <span data-testid="filter-icon" />,
  Download: () => <span data-testid="download-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  Phone: () => <span data-testid="phone-icon" />,
  MessageSquare: () => <span data-testid="message-icon" />,
  RefreshCw: () => <span data-testid="refresh-icon" />,
  CheckCircle2: () => <span data-testid="check-icon" />,
  XCircle: () => <span data-testid="x-icon" />,
  Users: () => <span data-testid="users-icon" />,
  Briefcase: () => <span data-testid="briefcase-icon" />,
  LayoutGrid: () => <span data-testid="grid-icon" />,
  List: () => <span data-testid="list-icon" />,
}));

const mockLeads = [
  {
    id: 1,
    first_name: 'Иван',
    last_name: 'Иванов',
    email: 'ivan@example.com',
    phone: '+7 999 123-45-67',
    company_name: 'ООО "Технологии"',
    status: 'new',
    created_at: '2024-01-15T10:00:00Z',
  },
];

describe('LeadsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getLeads.mockResolvedValue({
      results: mockLeads,
      count: 1,
    });
    client.deleteLead.mockResolvedValue({});
  });

  it('renders leads list with data', async () => {
    render(<LeadsList />);
    await waitFor(() => expect(screen.getByText('Лиды')).toBeInTheDocument());
    expect(screen.getByText(/Иван Иванов/)).toBeInTheDocument();
  });

  it('handles search', async () => {
    render(<LeadsList />);
    await waitFor(() => expect(screen.getByText(/Иван Иванов/)).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Поиск по имени, email.../);
    fireEvent.change(searchInput, { target: { value: 'Иван' } });
    fireEvent.click(screen.getByLabelText('Search'));

    await waitFor(() => {
      expect(client.getLeads).toHaveBeenCalledWith(expect.objectContaining({ search: 'Иван' }));
    });
  });

  it('handles pagination', async () => {
    client.getLeads.mockResolvedValue({ results: mockLeads, count: 15 });
    render(<LeadsList />);
    await waitFor(() => expect(screen.getByText(/Иван Иванов/)).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Next Page'));
    await waitFor(() => {
      expect(client.getLeads).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    });
  });

  it('deletes a lead', async () => {
    render(<LeadsList />);
    await waitFor(() => expect(screen.getByText(/Иван Иванов/)).toBeInTheDocument());

    // Click Delete in dropdown (it's already in the DOM with our mock, but let's be safe)
    const deleteBtn = screen.getAllByText('Удалить').find(el => el.closest('[data-testid="dropdown-content"]'));
    fireEvent.click(deleteBtn);

    // Confirm in dialog
    await waitFor(() => expect(screen.getByTestId('alert-dialog')).toBeInTheDocument());
    const confirmButton = screen.getByTestId('alert-dialog-action');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(client.deleteLead).toHaveBeenCalledWith(1);
    });
  });

  it('switches to kanban view', async () => {
    render(<LeadsList />);
    await waitFor(() => expect(screen.getByText(/Иван Иванов/)).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText('Table View')); 
    fireEvent.click(screen.getByLabelText('Kanban View'));

    await waitFor(() => {
      expect(screen.getByTestId('kanban')).toBeInTheDocument();
    });
  });
});
