import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as callsApi from '../../src/lib/api/calls';
import * as client from '../../src/lib/api/client';
import LeadDetail from '../../src/modules/leads/LeadDetail';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/client', () => ({
  getLead: vi.fn(),
  deleteLead: vi.fn(),
  leadsApi: {
    convert: vi.fn(),
    disqualify: vi.fn(),
    assign: vi.fn(),
  },
  getUsers: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock('../../src/router');
vi.mock('../../src/lib/api/calls');
vi.mock('../../src/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  DropdownMenuLabel: ({ children }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));
vi.mock('../../src/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }) => open ? <div data-testid="alert-dialog">{children}</div> : null,
  AlertDialogAction: ({ children, onClick }) => <button onClick={onClick} data-testid="alert-action">{children}</button>,
  AlertDialogCancel: ({ children, onClick }) => <button onClick={onClick} data-testid="alert-cancel">{children}</button>,
  AlertDialogContent: ({ children }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }) => <div>{children}</div>,
  AlertDialogFooter: ({ children }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }) => <div>{children}</div>,
  AlertDialogTrigger: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));
vi.mock('../../src/components/ui/tabs', () => ({
  Tabs: ({ children }) => <div>{children}</div>,
  TabsList: ({ children }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }) => <button role="tab" data-value={value}>{children}</button>,
  TabsContent: ({ children }) => <div>{children}</div>,
}));
vi.mock('../../src/components/CallButton', () => ({
  default: ({ phone, name }) => <button>Call {name} at {phone}</button>,
}));
vi.mock('../../src/modules/chat/ChatWidget', () => ({
  default: () => <div data-testid="chat-widget">Chat Widget</div>,
}));

const mockLead = {
  id: 1,
  first_name: 'Иван',
  last_name: 'Иванов',
  email: 'ivan@example.com',
  phone: '+7 999 123-45-67',
  company: 'ООО "Технологии"',
  position: 'Директор',
  title: 'Директор',
  status: 'new',
  source: 'website',
  description: 'Интересуется нашими услугами',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

const mockCallLogs = [
  {
    id: 1,
    phone_number: '+7 999 123-45-67',
    direction: 'outbound',
    status: 'completed',
    started_at: '2024-01-18T14:30:00Z',
    duration: 420,
    notes: 'Первый контакт',
  },
];

describe('LeadDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getLead.mockResolvedValue(mockLead);
    callsApi.getEntityCallLogs.mockResolvedValue({ results: mockCallLogs });
    client.leadsApi.convert.mockResolvedValue({});
    client.leadsApi.disqualify.mockResolvedValue({});
  });

  it('renders lead details', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
    expect(screen.getByText('+7 999 123-45-67')).toBeInTheDocument();
    expect(screen.getAllByText('ООО "Технологии"')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Директор')[0]).toBeInTheDocument();
  });

  it('shows loading state', () => {
    client.getLead.mockImplementation(() => new Promise(() => {}));
    const { container } = render(<LeadDetail id={1} />);
    
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('navigates back to list', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const backButton = screen.getAllByRole('button').find(b => b.textContent.includes('Назад'));
    fireEvent.click(backButton);

    expect(router.navigate).toHaveBeenCalledWith('/leads');
  });

  it('navigates to edit', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const actionsMenu = screen.getByRole('button', { name: /действия/i });
    fireEvent.pointerDown(actionsMenu); fireEvent.click(actionsMenu);

    const editButton = await screen.findByText('Редактировать');
    fireEvent.click(editButton);

    expect(router.navigate).toHaveBeenCalledWith('/leads/1/edit');
  });

  it('converts lead to deal', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const convertButton = screen.getAllByText('Конвертировать')[0];
    fireEvent.click(convertButton);

    // Confirm action
    await waitFor(() => {
      const confirmButton = screen.getByTestId('alert-action');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.leadsApi.convert).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  it('disqualifies lead', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const actionsMenu = screen.getByRole('button', { name: /действия/i });
    fireEvent.pointerDown(actionsMenu); fireEvent.click(actionsMenu);

    const disqualifyButton = await screen.findByText(/Дисквалифицировать/);
    fireEvent.click(disqualifyButton);

    // Confirm action
    await waitFor(() => {
      const confirmButton = screen.getByTestId('alert-action');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.leadsApi.disqualify).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  it('deletes lead', async () => {
    client.deleteLead.mockResolvedValue({});
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const actionsMenu = screen.getByRole('button', { name: /действия/i });
    fireEvent.click(actionsMenu);

    const deleteButton = await screen.findByText('Удалить');
    fireEvent.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByTestId('alert-action');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.deleteLead).toHaveBeenCalledWith(1);
      expect(router.navigate).toHaveBeenCalledWith('/leads');
    });
  });

  it('displays call logs', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      // The call log 'direction: outbound' renders as 'Исходящий звонок'
      expect(screen.getByText('Исходящий звонок')).toBeInTheDocument();
    });
  });

  it('displays chat widget', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
    });
  });


  it('handles error when loading lead', async () => {
    client.getLead.mockRejectedValue(new Error('API Error'));
    
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(client.getLead).toHaveBeenCalled();
    });

    // Should not display mock data
    expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument();
  });

  it('handles error when converting lead', async () => {
    client.leadsApi.convert.mockRejectedValue(new Error('Conversion failed'));
    
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const convertButton = screen.getAllByText('Конвертировать')[0];
    fireEvent.click(convertButton);

    await waitFor(() => {
      const confirmButton = screen.getByTestId('alert-action');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.leadsApi.convert).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  it('handles error when loading call logs', async () => {
    callsApi.getEntityCallLogs.mockRejectedValue(new Error('API Error'));
    
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    // Switch to calls tab
    const callsTab = screen.getByRole('tab', { name: /Звонки/i });
    fireEvent.click(callsTab);

    await waitFor(() => {
      expect(callsApi.getEntityCallLogs).toHaveBeenCalled();
    });

    // Should show empty state
    expect(screen.queryByText('Первый контакт')).not.toBeInTheDocument();
  });
});
