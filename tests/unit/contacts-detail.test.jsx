import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactDetail from '../../src/modules/contacts/ContactDetail';
import * as client from '../../src/lib/api/client';
import * as router from '../../src/router';
import * as callsApi from '../../src/lib/api/calls';

// Mock dependencies
vi.mock('../../src/lib/api/client');
vi.mock('../../src/router');
vi.mock('../../src/lib/api/calls');
vi.mock('../../src/components/CallButton', () => ({
  default: ({ phone, name }) => <button>Call {name} at {phone}</button>,
}));
vi.mock('../../src/modules/chat/ChatWidget', () => ({
  default: () => <div data-testid="chat-widget">Chat Widget</div>,
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
  created_at: '2024-01-20T10:30:00Z',
  updated_at: '2024-01-20T10:30:00Z',
};

const mockCallLogs = [
  {
    id: 1,
    phone_number: '+7 999 111-22-33',
    direction: 'outbound',
    status: 'completed',
    started_at: '2024-01-20T10:30:00Z',
    duration: 300,
    notes: 'Обсудили условия сотрудничества',
  },
];

describe('ContactDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getContact.mockResolvedValue(mockContact);
    callsApi.getEntityCallLogs.mockResolvedValue({ results: mockCallLogs });
  });

  it('renders contact details', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    expect(screen.getByText('anna@example.com')).toBeInTheDocument();
    expect(screen.getByText('+7 999 111-22-33')).toBeInTheDocument();
    expect(screen.getByText('ООО "Альфа"')).toBeInTheDocument();
    expect(screen.getByText('Менеджер')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    client.getContact.mockImplementation(() => new Promise(() => {}));
    render(<ContactDetail id={1} />);
    
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('navigates back to list', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Назад к списку');
    fireEvent.click(backButton);

    expect(router.navigate).toHaveBeenCalledWith('/contacts');
  });

  it('navigates to edit', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Редактировать');
    fireEvent.click(editButton);

    expect(router.navigate).toHaveBeenCalledWith('/contacts/1/edit');
  });

  it('deletes contact', async () => {
    client.deleteContact.mockResolvedValue({});
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Удалить');
    fireEvent.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByText('Да');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.deleteContact).toHaveBeenCalledWith(1);
      expect(router.navigate).toHaveBeenCalledWith('/contacts');
    });
  });

  it('displays call logs', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    // Switch to calls tab
    const callsTab = screen.getByText(/История звонков/);
    fireEvent.click(callsTab);

    await waitFor(() => {
      expect(screen.getByText('Обсудили условия сотрудничества')).toBeInTheDocument();
    });
  });

  it('displays chat widget', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    // Switch to messages tab
    const messagesTab = screen.getByText('Сообщения');
    fireEvent.click(messagesTab);

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

    // Should not display mock data
    expect(screen.queryByText('Анна Смирнова')).not.toBeInTheDocument();
  });

  it('handles error when loading call logs', async () => {
    callsApi.getEntityCallLogs.mockRejectedValue(new Error('API Error'));
    
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Анна Смирнова')).toBeInTheDocument();
    });

    // Switch to calls tab
    const callsTab = screen.getByText(/История звонков/);
    fireEvent.click(callsTab);

    await waitFor(() => {
      expect(callsApi.getEntityCallLogs).toHaveBeenCalled();
    });

    // Should show empty state
    expect(screen.queryByText('Обсудили условия сотрудничества')).not.toBeInTheDocument();
  });

  it('displays type badge correctly', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Клиент')).toBeInTheDocument();
    });
  });

  it('displays website link', async () => {
    render(<ContactDetail id={1} />);
    
    await waitFor(() => {
      const websiteLink = screen.getByText('https://example.com');
      expect(websiteLink).toBeInTheDocument();
      expect(websiteLink.closest('a')).toHaveAttribute('href', 'https://example.com');
    });
  });
});
