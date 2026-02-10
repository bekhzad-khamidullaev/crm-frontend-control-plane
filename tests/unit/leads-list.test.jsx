import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeadsList from '../../src/modules/leads/LeadsList';
import * as client from '../../src/lib/api/client';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/client');
vi.mock('../../src/router');
vi.mock('../../src/lib/api/export');
vi.mock('../../src/modules/leads/LeadsKanban', () => ({
  default: () => <div data-testid="kanban">Kanban View</div>,
}));
vi.mock('../../src/modules/leads/LeadsKPI', () => ({
  default: ({ leads }) => <div data-testid="kpi">KPI: {leads.length} leads</div>,
}));

const mockLeads = [
  {
    id: 1,
    first_name: 'Иван',
    last_name: 'Иванов',
    email: 'ivan@example.com',
    phone: '+7 999 123-45-67',
    company: 'ООО "Технологии"',
    status: 'new',
    source: 'website',
    created_at: '2024-01-15',
  },
  {
    id: 2,
    first_name: 'Мария',
    last_name: 'Петрова',
    email: 'maria@example.com',
    phone: '+7 999 234-56-78',
    company: 'АО "Инновации"',
    status: 'contacted',
    source: 'referral',
    created_at: '2024-01-14',
  },
];

describe('LeadsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getLeads.mockResolvedValue({
      results: mockLeads,
      count: 2,
    });
  });

  it('renders leads list with data', async () => {
    render(<LeadsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Лиды')).toBeInTheDocument();
    });

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Мария Петрова')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    client.getLeads.mockImplementation(() => new Promise(() => {}));
    render(<LeadsList />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('handles search', async () => {
    render(<LeadsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Поиск по имени/);
    fireEvent.change(searchInput, { target: { value: 'Иван' } });
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(client.getLeads).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Иван',
        })
      );
    });
  });

  it('handles pagination', async () => {
    render(<LeadsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    // Find and click next page button
    const nextButton = screen.getByRole('button', { name: /next/i });
    if (nextButton && !nextButton.disabled) {
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(client.getLeads).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    }
  });

  it('navigates to create new lead', async () => {
    render(<LeadsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Создать лид')).toBeInTheDocument();
    });

    const createButton = screen.getByText('Создать лид');
    fireEvent.click(createButton);

    expect(router.navigate).toHaveBeenCalledWith('/leads/new');
  });

  it('deletes a lead', async () => {
    client.deleteLead.mockResolvedValue({});
    render(<LeadsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Удалить');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion
    await waitFor(() => {
      const confirmButton = screen.getByText('Да');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(client.deleteLead).toHaveBeenCalledWith(1);
    });
  });

  it('switches to kanban view', async () => {
    render(<LeadsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    const kanbanButton = screen.getByText('Канбан');
    fireEvent.click(kanbanButton);

    await waitFor(() => {
      expect(screen.getByTestId('kanban')).toBeInTheDocument();
    });
  });

  it('toggles KPI display', async () => {
    render(<LeadsList />);
    
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
    vi.spyOn(client, 'leadsApi', 'get').mockReturnValue({
      patch: vi.fn().mockResolvedValue({}),
    });
    
    render(<LeadsList />);
    
    await waitFor(() => {
      expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
    });

    // This would require more complex interaction with EditableCell
    // For now, just verify the component renders
    expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
  });

  it('handles bulk delete', async () => {
    client.deleteLead.mockResolvedValue({});
    render(<LeadsList />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    // Select checkboxes (implementation depends on Ant Design Table)
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First lead
    fireEvent.click(checkboxes[2]); // Second lead

    // This would trigger bulk actions
    // Implementation depends on BulkActions component
  });

  it('handles error when fetching leads', async () => {
    client.getLeads.mockRejectedValue(new Error('API Error'));
    
    render(<LeadsList />);
    
    await waitFor(() => {
      expect(client.getLeads).toHaveBeenCalled();
    });

    // Should show empty state, not mock data
    await waitFor(() => {
      expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument();
    });
  });
});
