import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  Avatar,
  Tag,
  Typography,
  Space,
  Button,
  message,
  Spin,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  DragOutlined,
} from '@ant-design/icons';
import { navigate } from '../../router';
import { getLeads, updateLead } from '../../lib/api/client';
import './LeadsKanban.css';

const { Text } = Typography;

const statusColumns = {
  new: { title: 'Новые', color: '#1890ff' },
  contacted: { title: 'Связались', color: '#faad14' },
  qualified: { title: 'Квалифицированы', color: '#52c41a' },
  converted: { title: 'Конвертированы', color: '#13c2c2' },
  lost: { title: 'Потеряны', color: '#ff4d4f' },
};

// Sortable Card Component
function SortableLeadCard({ lead, config }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on drag handle
    if (e.target.closest('.drag-handle')) {
      return;
    }
    navigate(`/leads/${lead.id}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
    >
      <Card
        size="small"
        hoverable
        style={{
          marginBottom: 8,
          cursor: 'pointer',
        }}
        onClick={handleCardClick}
      >
        <div 
          {...listeners} 
          className="drag-handle"
          style={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            cursor: 'grab',
            padding: '4px',
            zIndex: 10,
          }}
        >
          <DragOutlined style={{ color: '#999', fontSize: 16 }} />
        </div>
        
        <Space
          direction="vertical"
          size="small"
          style={{ width: '100%' }}
        >
          <Space>
            <Avatar
              icon={<UserOutlined />}
              size="small"
              style={{ backgroundColor: config.color }}
            />
            <Text strong>
              {lead.first_name} {lead.last_name}
            </Text>
          </Space>

          {lead.company && (
            <Text
              type="secondary"
              style={{ fontSize: 12 }}
            >
              {lead.company}
            </Text>
          )}

          <Space
            direction="vertical"
            size={2}
            style={{ width: '100%' }}
          >
            {lead.email && (
              <Space size={4}>
                <MailOutlined
                  style={{
                    fontSize: 12,
                    color: '#999',
                  }}
                />
                <Text
                  style={{ fontSize: 12 }}
                  ellipsis
                >
                  {lead.email}
                </Text>
              </Space>
            )}
            {lead.phone && (
              <Space size={4}>
                <PhoneOutlined
                  style={{
                    fontSize: 12,
                    color: '#999',
                  }}
                />
                <Text style={{ fontSize: 12 }}>
                  {lead.phone}
                </Text>
              </Space>
            )}
          </Space>
        </Space>
      </Card>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ status, config, children, count, onAddNew }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div 
      ref={setNodeRef}
      className="kanban-column"
      style={{
        backgroundColor: isOver ? 'rgba(24, 144, 255, 0.05)' : 'transparent',
        transition: 'background-color 0.2s',
      }}
    >
      <div
        className="kanban-column-header"
        style={{ borderTopColor: config.color }}
      >
        <Space>
          <div
            className="kanban-column-indicator"
            style={{ backgroundColor: config.color }}
          />
          <Text strong>{config.title}</Text>
          <Tag color={config.color}>{count}</Tag>
        </Space>
        <Button
          type="text"
          icon={<PlusOutlined />}
          size="small"
          onClick={onAddNew}
        />
      </div>
      {children}
    </div>
  );
}

function LeadsKanban() {
  const [columns, setColumns] = useState({
    new: [],
    contacted: [],
    qualified: [],
    converted: [],
    lost: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Требуется переместить на 8px перед началом drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await getLeads({ page_size: 100 });
      const leads = response.results || [];
      
      // Group leads by status
      const grouped = {
        new: [],
        contacted: [],
        qualified: [],
        converted: [],
        lost: [],
      };

      leads.forEach((lead) => {
        if (grouped[lead.status]) {
          grouped[lead.status].push(lead);
        } else {
          grouped.new.push(lead);
        }
      });

      setColumns(grouped);
    } catch (error) {
      message.error('Ошибка загрузки лидов');
      // Mock data for demo
      setColumns({
        new: [
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
            id: 4,
            first_name: 'Ольга',
            last_name: 'Соколова',
            email: 'olga@example.com',
            phone: '+7 999 456-78-90',
            company: 'ИП Соколова',
            status: 'new',
          },
        ],
        contacted: [
          {
            id: 2,
            first_name: 'Мария',
            last_name: 'Петрова',
            email: 'maria@example.com',
            phone: '+7 999 234-56-78',
            company: 'АО "Инновации"',
            status: 'contacted',
          },
        ],
        qualified: [
          {
            id: 3,
            first_name: 'Алексей',
            last_name: 'Сидоров',
            email: 'alexey@example.com',
            phone: '+7 999 345-67-89',
            company: 'ИП Сидоров',
            status: 'qualified',
          },
        ],
        converted: [],
        lost: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const findContainer = (id) => {
    if (id in columns) {
      return id;
    }

    return Object.keys(columns).find((key) =>
      columns[key].some((lead) => lead.id === id)
    );
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id) || over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setColumns((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];

      const activeIndex = activeItems.findIndex((item) => item.id === active.id);
      const overIndex = overItems.findIndex((item) => item.id === over.id);

      let newIndex;
      if (over.id in prev) {
        newIndex = overItems.length;
      } else {
        newIndex = overIndex >= 0 ? overIndex : 0;
      }

      const updatedLead = { ...activeItems[activeIndex], status: overContainer };

      return {
        ...prev,
        [activeContainer]: activeItems.filter((item) => item.id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          updatedLead,
          ...overItems.slice(newIndex),
        ],
      };
    });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id) || over.id;

    if (!activeContainer || !overContainer) return;

    const activeLead = columns[activeContainer].find((l) => l.id === active.id);

    if (activeContainer !== overContainer) {
      try {
        await updateLead(activeLead.id, { status: overContainer });
        message.success(
          `Лид перемещен в "${statusColumns[overContainer].title}"`
        );
      } catch (error) {
        message.error('Ошибка обновления статуса лида');
        fetchLeads();
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const activeLead = activeId
    ? Object.values(columns)
        .flat()
        .find((lead) => lead.id === activeId)
    : null;

  return (
    <div className="kanban-board">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          {Object.entries(statusColumns).map(([status, config]) => (
            <DroppableColumn
              key={status}
              status={status}
              config={config}
              count={columns[status].length}
              onAddNew={() => navigate('/leads/new')}
            >
              <SortableContext
                id={status}
                items={columns[status].map((lead) => lead.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="kanban-column-content">
                  {columns[status].map((lead) => (
                    <SortableLeadCard
                      key={lead.id}
                      lead={lead}
                      config={config}
                    />
                  ))}

                  {columns[status].length === 0 && (
                    <div className="kanban-column-empty">
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Перетащите лиды сюда
                      </Text>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeLead ? (
            <Card size="small" style={{ width: 280, cursor: 'grabbing' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <Avatar icon={<UserOutlined />} size="small" />
                  <Text strong>
                    {activeLead.first_name} {activeLead.last_name}
                  </Text>
                </Space>
                {activeLead.company && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {activeLead.company}
                  </Text>
                )}
              </Space>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default LeadsKanban;
