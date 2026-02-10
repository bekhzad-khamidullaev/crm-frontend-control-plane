import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeadDetail from '../../src/modules/leads/LeadDetail';
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

const mockLead = {
  id: 1,
  first_name: 'Иван',
  last_name: 'Иванов',
  email: 'ivan@example.com',
  phone: '+7 999 123-45-67',
  company: 'ООО "Технологии"',
  position: 'Директор',
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
    vi.spyOn(client, 'leadsApi', 'get').mockReturnValue({
      convert: vi.fn().mockResolvedValue({}),
      disqualify: vi.fn().mockResolvedValue({}),
    });
  });

  it('renders lead details', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
    expect(screen.getByText('+7 999 123-45-67')).toBeInTheDocument();
    expect(screen.getByText('ООО "Технологии"')).toBeInTheDocument();
    expect(screen.getByText('Директор')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    client.getLead.mockImplementation(() => new Promise(() => {}));
    render(<LeadDetail id={1} />);
    
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Ant Design Spin
  });

  it('navigates back to list', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Назад к списку');
    fireEvent.click(backButton);

    expect(router.navigate).toHaveBeenCalledWith('/leads');
  });

  it('navigates to edit', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const editButton = screen.getByText('Редактировать');
    fireEvent.click(editButton);

    expect(router.navigate).toHaveBeenCalledWith('/leads/1/edit');
  });

  it('converts lead to deal', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const convertButton = screen.getByText('Конвертировать');
    fireEvent.click(convertButton);

    // Confirm action
    await waitFor(() => {
      const confirmButton = screen.getByText('Да');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.leadsApi.convert).toHaveBeenCalledWith(1);
    });
  });

  it('disqualifies lead', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const disqualifyButton = screen.getByText('Дисквалифицировать');
    fireEvent.click(disqualifyButton);

    // Confirm action
    await waitFor(() => {
      const confirmButton = screen.getByText('Да');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.leadsApi.disqualify).toHaveBeenCalledWith(1);
    });
  });

  it('deletes lead', async () => {
    client.deleteLead.mockResolvedValue({});
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('Удалить');
    fireEvent.click(deleteButton);

    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByText('Да');
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
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    // Switch to calls tab
    const callsTab = screen.getByText(/История звонков/);
    fireEvent.click(callsTab);

    await waitFor(() => {
      expect(screen.getByText('Первый контакт')).toBeInTheDocument();
    });
  });

  it('displays chat widget', async () => {
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    // Switch to messages tab
    const messagesTab = screen.getByText('Сообщения');
    fireEvent.click(messagesTab);

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

    const convertButton = screen.getByText('Конвертировать');
    fireEvent.click(convertButton);

    await waitFor(() => {
      const confirmButton = screen.getByText('Да');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.leadsApi.convert).toHaveBeenCalledWith(1);
    });
  });

  it('handles error when loading call logs', async () => {
    callsApi.getEntityCallLogs.mockRejectedValue(new Error('API Error'));
    
    render(<LeadDetail id={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    // Switch to calls tab
    const callsTab = screen.getByText(/История звонков/);
    fireEvent.click(callsTab);

    await waitFor(() => {
      expect(callsApi.getEntityCallLogs).toHaveBeenCalled();
    });

    // Should show empty state
    expect(screen.queryByText('Первый контакт')).not.toBeInTheDocument();
  });
});
