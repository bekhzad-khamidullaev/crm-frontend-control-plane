import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as callsApi from '../../src/lib/api/calls';
import * as client from '../../src/lib/api/client';
import * as reference from '../../src/lib/api/reference';
import ContactDetail from '../../src/modules/contacts/ContactDetail';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/client', () => ({
  getContact: vi.fn(),
  deleteContact: vi.fn(),
  getCompanies: vi.fn(),
  getUsers: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock('../../src/router');
vi.mock('../../src/lib/api/calls', () => ({
  getEntityCallLogs: vi.fn(),
}));
vi.mock('../../src/lib/api/reference', () => ({
  getLeadSources: vi.fn(),
  getCrmTags: vi.fn(),
  getCountries: vi.fn(),
  getCities: vi.fn(),
  getDepartments: vi.fn(),
}));
vi.mock('../../src/components/CallButton', () => ({
  default: ({ phone, name }) => <button>Call {name} at {phone}</button>,
}));
vi.mock('../../src/modules/chat/ChatWidget', () => ({
  default: () => <div data-testid="chat-widget">Chat Widget</div>,
}));
vi.mock('../../src/components/ActivityLog', () => ({
  default: () => <div data-testid="activity-log">Activity Log</div>,
}));
vi.mock('../../src/components/ui/tabs', () => ({
  Tabs: ({ children }) => <div>{children}</div>,
  TabsList: ({ children }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value }) => <button role="tab" data-value={value}>{children}</button>,
  TabsContent: ({ children }) => <div>{children}</div>,
}));
vi.mock('../../src/components/ui-EnhancedTable', () => ({
  default: ({ dataSource, columns }) => (
    <table>
      <tbody>
        {(dataSource || []).map((row, i) => (
          <tr key={i}>
            {(columns || []).map((col, j) => (
              <td key={j}>{col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

const mockContact = {
  id: 1,
  first_name: 'Анна',
  last_name: 'Смирнова',
  full_name: 'Анна Смирнова',
  email: 'anna@example.com',
  phone: '+7 999 111-22-33',
  company: 1,
  title: 'Менеджер',
  type: 'client',
  address: 'г. Москва, ул. Ленина, д. 1',
  massmail: true,
  disqualified: false,
};

const mockCallLogs = [
  {
    id: 1,
    phone_number: '+7 999 111-22-33',
    direction: 'outbound',
    started_at: '2024-01-20T10:30:00Z',
    duration: 300,
  },
];

const emptyPage = { results: [], count: 0 };
const companiesPage = { results: [{ id: 1, name: 'ООО "Альфа"', full_name: 'ООО "Альфа"' }] };

describe('ContactDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getContact.mockResolvedValue(mockContact);
    client.getCompanies.mockResolvedValue(companiesPage);
    client.getUsers.mockResolvedValue(emptyPage);
    callsApi.getEntityCallLogs.mockResolvedValue({ results: mockCallLogs });
    reference.getLeadSources.mockResolvedValue(emptyPage);
    reference.getCrmTags.mockResolvedValue(emptyPage);
    reference.getCountries.mockResolvedValue(emptyPage);
    reference.getCities.mockResolvedValue(emptyPage);
    reference.getDepartments.mockResolvedValue(emptyPage);
  });

  it('renders contact details', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Анна Смирнова')[0]).toBeInTheDocument();
    });

    expect(screen.getByText('anna@example.com')).toBeInTheDocument();
    expect(screen.getByText('+7 999 111-22-33')).toBeInTheDocument();
    expect(screen.getAllByText('ООО "Альфа"')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Менеджер')[0]).toBeInTheDocument();
  });

  it('shows loading state', () => {
    client.getContact.mockImplementation(() => new Promise(() => {}));
    render(<ContactDetail id={1} />);
    
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('navigates back to list', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Анна Смирнова')[0]).toBeInTheDocument();
    });

    const backButton = screen.getByText('Назад к списку');
    fireEvent.click(backButton);

    expect(router.navigate).toHaveBeenCalledWith('/contacts');
  });

  it('navigates to edit', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Анна Смирнова')[0]).toBeInTheDocument();
    });

    const editButton = screen.getByText('Редактировать');
    fireEvent.click(editButton);

    expect(router.navigate).toHaveBeenCalledWith('/contacts/1/edit');
  });

  it('deletes contact', async () => {
    client.deleteContact.mockResolvedValue({});
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Анна Смирнова')[0]).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Удалить');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(client.deleteContact).toHaveBeenCalledWith(1);
      expect(router.navigate).toHaveBeenCalledWith('/contacts');
    });
  });

  it('displays call logs', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      // Call logs are loaded with outbound direction = Исходящий
      expect(screen.getByText('Исходящий')).toBeInTheDocument();
    });
  });

  it('displays chat widget', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
    });
  });

  it('handles error when loading contact', async () => {
    client.getContact.mockRejectedValue(new Error('API Error'));
    
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(client.getContact).toHaveBeenCalled();
    });

    expect(screen.queryByText('Анна Смирнова')).not.toBeInTheDocument();
  });

  it('handles error when loading call logs', async () => {
    callsApi.getEntityCallLogs.mockRejectedValue(new Error('API Error'));
    
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Анна Смирнова')[0]).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(callsApi.getEntityCallLogs).toHaveBeenCalled();
    });
  });

  it('displays massmail status', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Анна Смирнова')[0]).toBeInTheDocument();
    });
    // massmail: true shows 'Да' badge
    expect(screen.getAllByText('Да')[0]).toBeInTheDocument();
  });
});
