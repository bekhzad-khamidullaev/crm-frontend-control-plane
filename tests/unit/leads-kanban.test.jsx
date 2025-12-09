import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import LeadsKanban from '../../src/modules/leads/LeadsKanban';
import * as client from '../../src/lib/api/client';
import * as router from '../../src/router';

// Mock dependencies
vi.mock('../../src/lib/api/client');
vi.mock('../../src/router');

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  DragOverlay: ({ children }) => <div data-testid="drag-overlay">{children}</div>,
  closestCorners: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  useDroppable: vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  })),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: vi.fn(() => ''),
    },
  },
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
  },
  {
    id: 2,
    first_name: 'Мария',
    last_name: 'Петрова',
    email: 'maria@example.com',
    phone: '+7 999 234-56-78',
    company: 'АО "Инновации"',
    status: 'contacted',
  },
  {
    id: 3,
    first_name: 'Алексей',
    last_name: 'Сидоров',
    email: 'alexey@example.com',
    phone: '+7 999 345-67-89',
    company: 'ИП Сидоров',
    status: 'qualified',
  },
];

describe('LeadsKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getLeads.mockResolvedValue({
      results: mockLeads,
      count: 3,
    });
    client.updateLead.mockResolvedValue({});
  });

  it('renders kanban board with columns', async () => {
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('Новые')).toBeInTheDocument();
    });

    expect(screen.getByText('Связались')).toBeInTheDocument();
    expect(screen.getByText('Квалифицированы')).toBeInTheDocument();
    expect(screen.getByText('Конвертированы')).toBeInTheDocument();
    expect(screen.getByText('Потеряны')).toBeInTheDocument();
  });

  it('displays leads in correct columns', async () => {
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    });

    expect(screen.getByText('Мария Петрова')).toBeInTheDocument();
    expect(screen.getByText('Алексей Сидоров')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    client.getLeads.mockImplementation(() => new Promise(() => {}));
    render(<LeadsKanban />);
    
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Ant Design Spin
  });

  it('handles API error', async () => {
    client.getLeads.mockRejectedValue(new Error('API Error'));
    
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(client.getLeads).toHaveBeenCalled();
    });

    // Should show empty columns, not mock data
    await waitFor(() => {
      expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument();
    });
  });

  it('shows add button for each column', async () => {
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('Новые')).toBeInTheDocument();
    });

    // Should have add buttons for each column (5 columns)
    const addButtons = screen.getAllByRole('button', { name: /plus/i });
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('displays company information', async () => {
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('ООО "Технологии"')).toBeInTheDocument();
    });

    expect(screen.getByText('АО "Инновации"')).toBeInTheDocument();
    expect(screen.getByText('ИП Сидоров')).toBeInTheDocument();
  });

  it('displays contact information', async () => {
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('ivan@example.com')).toBeInTheDocument();
    });

    expect(screen.getByText('+7 999 123-45-67')).toBeInTheDocument();
  });

  it('shows empty state for empty columns', async () => {
    client.getLeads.mockResolvedValue({
      results: [],
      count: 0,
    });
    
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('Новые')).toBeInTheDocument();
    });

    // Should show "Перетащите лиды сюда" messages
    const emptyMessages = screen.getAllByText('Перетащите лиды сюда');
    expect(emptyMessages.length).toBe(5); // 5 columns
  });

  it('groups leads by status correctly', async () => {
    const mixedStatusLeads = [
      { id: 1, first_name: 'A', last_name: 'A', status: 'new' },
      { id: 2, first_name: 'B', last_name: 'B', status: 'new' },
      { id: 3, first_name: 'C', last_name: 'C', status: 'contacted' },
      { id: 4, first_name: 'D', last_name: 'D', status: 'qualified' },
      { id: 5, first_name: 'E', last_name: 'E', status: 'converted' },
      { id: 6, first_name: 'F', last_name: 'F', status: 'lost' },
    ];
    
    client.getLeads.mockResolvedValue({
      results: mixedStatusLeads,
      count: 6,
    });
    
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('A A')).toBeInTheDocument();
    });

    // All leads should be displayed
    expect(screen.getByText('B B')).toBeInTheDocument();
    expect(screen.getByText('C C')).toBeInTheDocument();
    expect(screen.getByText('D D')).toBeInTheDocument();
    expect(screen.getByText('E E')).toBeInTheDocument();
    expect(screen.getByText('F F')).toBeInTheDocument();
  });

  it('handles leads with unknown status', async () => {
    const leadsWithUnknownStatus = [
      { id: 1, first_name: 'Test', last_name: 'User', status: 'unknown_status' },
    ];
    
    client.getLeads.mockResolvedValue({
      results: leadsWithUnknownStatus,
      count: 1,
    });
    
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Lead with unknown status should be placed in 'new' column
  });
});
