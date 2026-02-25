import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as client from '../../src/lib/api/client';
import LeadsKanban from '../../src/modules/leads/LeadsKanban';

// Mock dependencies
vi.mock('../../src/lib/api/client', () => ({
  getLeads: vi.fn(),
  leadsApi: {
    disqualify: vi.fn(),
    convert: vi.fn(),
    patch: vi.fn(),
  },
}));

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
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
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

// Mock Lucide icons to have predictable names
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="plus-icon">Plus</span>,
  Mail: () => <span>Mail</span>,
  Phone: () => <span>Phone</span>,
  User: () => <span>User</span>,
  GripVertical: () => <span>Grip</span>,
  Briefcase: () => <span>Briefcase</span>,
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
  },
  {
    id: 2,
    first_name: 'Мария',
    last_name: 'Петрова',
    email: 'maria@example.com',
    phone: '+7 999 234-56-78',
    company_name: 'АО "Инновации"',
    status: 'converted',
  },
  {
    id: 3,
    first_name: 'Алексей',
    last_name: 'Сидоров',
    email: 'alexey@example.com',
    phone: '+7 999 345-67-89',
    company_name: 'ИП Сидоров',
    status: 'lost',
  },
];

describe('LeadsKanban', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.getLeads.mockResolvedValue({
      results: mockLeads,
      count: 3,
    });
  });

  it('renders kanban board with columns', async () => {
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('Новые')).toBeInTheDocument();
    });

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
    
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('handles API error', async () => {
    client.getLeads.mockRejectedValue(new Error('API Error'));
    
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(client.getLeads).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByText('Иван Иванов')).not.toBeInTheDocument();
    });
  });

  it('shows add button for each column', async () => {
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('Новые')).toBeInTheDocument();
    });

    // Each column has an add button with Plus icon
    const plusIcons = screen.getAllByTestId('plus-icon');
    expect(plusIcons.length).toBe(3); // 3 columns
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

  it('groups leads by status correctly', async () => {
    const mixedStatusLeads = [
      { id: 1, first_name: 'A', last_name: 'A', status: 'new' },
      { id: 2, first_name: 'B', last_name: 'B', status: 'new' },
      { id: 3, first_name: 'C', last_name: 'C', status: 'converted' },
      { id: 4, first_name: 'D', last_name: 'D', status: 'lost' },
    ];
    
    client.getLeads.mockResolvedValue({
      results: mixedStatusLeads,
      count: 4,
    });
    
    render(<LeadsKanban />);
    
    await waitFor(() => {
      expect(screen.getByText('A A')).toBeInTheDocument();
    });

    expect(screen.getByText('B B')).toBeInTheDocument();
    expect(screen.getByText('C C')).toBeInTheDocument();
    expect(screen.getByText('D D')).toBeInTheDocument();
  });
});
