import {
  useConvertLead,
  useDisqualifyLead,
  useLeads,
  usePatchLead,
  type Lead,
  type LeadStatus,
  deriveLeadStatus,
} from '@/entities/lead';
import { navigate } from '@/router.js';
import {
  BankOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { DndContext, type DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { Avatar, Badge, Button, Card, Empty, Flex, Input, message, Skeleton, Space, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

const { Text } = Typography;
const CARD_ID_PREFIX = 'lead-';

type KanbanStatusConfig = {
  title: string;
  color: string;
};

const STATUS_CONFIG: Record<LeadStatus, KanbanStatusConfig> = {
  new: { title: 'Новые', color: '#1677ff' },
  contacted: { title: 'Связались', color: '#faad14' },
  qualified: { title: 'Квалифицированы', color: '#722ed1' },
  converted: { title: 'Конвертированы', color: '#13c2c2' },
  lost: { title: 'Потеряны', color: '#ff4d4f' },
};

const toCardId = (leadId: number) => `${CARD_ID_PREFIX}${leadId}`;

const parseCardId = (value: string | number): number | null => {
  const raw = String(value);
  if (!raw.startsWith(CARD_ID_PREFIX)) return null;
  const id = Number(raw.slice(CARD_ID_PREFIX.length));
  return Number.isFinite(id) ? id : null;
};

const updateLeadForStatus = (lead: Lead, status: LeadStatus): Lead => {
  if (status === 'converted') {
    return { ...lead, status: 'converted', disqualified: false, was_in_touch: new Date().toISOString() };
  }
  if (status === 'qualified') {
    return { ...lead, status: 'qualified', disqualified: false };
  }
  if (status === 'contacted') {
    return { ...lead, status: 'contacted', disqualified: false };
  }
  if (status === 'lost') return { ...lead, status: 'lost', disqualified: true };
  return {
    ...lead,
    status: 'new',
    disqualified: false,
    was_in_touch: null,
  };
};

const LeadCard: React.FC<{ lead: Lead; readOnly?: boolean }> = ({ lead, readOnly = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: toCardId(lead.id),
    disabled: readOnly,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.65 : 1,
    cursor: readOnly ? 'pointer' : 'grab',
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      bodyStyle={{ padding: 12 }}
      hoverable
      onClick={() => navigate(`/leads/${lead.id}`)}
      {...(readOnly ? {} : listeners)}
      {...(readOnly ? {} : attributes)}
    >
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Flex justify="space-between" align="center">
          <Space size={8}>
            <Avatar icon={<UserOutlined />} />
            <Text strong>{lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim()}</Text>
          </Space>
        </Flex>

        {lead.company_name && (
          <Text type="secondary">
            <BankOutlined /> {lead.company_name}
          </Text>
        )}
        {lead.email && (
          <Text type="secondary" ellipsis>
            <MailOutlined /> {lead.email}
          </Text>
        )}
        {lead.phone && (
          <Text type="secondary">
            <PhoneOutlined /> {lead.phone}
          </Text>
        )}
      </Space>
    </Card>
  );
};

const KanbanColumn: React.FC<{
  status: LeadStatus;
  leads: Lead[];
  loading?: boolean;
  readOnly?: boolean;
}> = ({ status, leads, loading = false, readOnly = false }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 280,
        width: 320,
        background: isOver ? '#f0f5ff' : '#fafafa',
        border: `1px solid ${isOver ? '#91caff' : '#f0f0f0'}`,
        borderRadius: 12,
        padding: 12,
        transition: 'all 0.2s ease',
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
        <Space>
          <Badge color={config.color} />
          <Text strong>{config.title}</Text>
        </Space>
        <Text type="secondary">{leads.length}</Text>
      </Flex>

      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        {loading && leads.length === 0 && <Skeleton active paragraph={{ rows: 2 }} />}
        {!loading && leads.length === 0 && <Empty description="Пусто" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} readOnly={readOnly} />
        ))}
      </Space>
    </div>
  );
};

export const LeadsKanbanBoard: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [boardLeads, setBoardLeads] = useState<Lead[]>([]);
  const [updatingLeadId, setUpdatingLeadId] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useLeads({
    page: 1,
    page_size: 200,
    ordering: '-creation_date',
    search: debouncedSearch || undefined,
  } as any);

  const convertLead = useConvertLead();
  const disqualifyLead = useDisqualifyLead();
  const patchLead = usePatchLead();

  useEffect(() => {
    setBoardLeads(response?.results ?? []);
  }, [response?.results]);

  const groupedLeads = useMemo(() => {
    return boardLeads.reduce<Record<LeadStatus, Lead[]>>(
      (acc, lead) => {
        acc[deriveLeadStatus(lead)].push(lead);
        return acc;
      },
      { new: [], contacted: [], qualified: [], converted: [], lost: [] }
    );
  }, [boardLeads]);

  const handleStatusChange = async (leadId: number, toStatus: LeadStatus) => {
    const currentLead = boardLeads.find((lead) => lead.id === leadId);
    if (!currentLead) return;

    const fromStatus = deriveLeadStatus(currentLead);
    if (fromStatus === toStatus) return;

    if (fromStatus === 'converted' && toStatus !== 'converted') {
      message.warning('Из колонки "Конвертированы" лид переносить нельзя');
      return;
    }

    const previousLeads = boardLeads;
    setBoardLeads((prev) => prev.map((lead) => (lead.id === leadId ? updateLeadForStatus(lead, toStatus) : lead)));
    setUpdatingLeadId(leadId);

    try {
      if (toStatus === 'converted') {
        await convertLead.mutateAsync({ id: leadId, data: { create_deal: true } });
      } else if (toStatus === 'lost') {
        await disqualifyLead.mutateAsync({ id: leadId, data: currentLead });
      } else {
        await patchLead.mutateAsync({
          id: leadId,
          data: {
            status: toStatus,
            disqualified: false,
            ...(toStatus === 'new' ? { was_in_touch: null } : {}),
          },
        });
      }
      message.success(`Лид перемещён: ${STATUS_CONFIG[toStatus].title}`);
    } catch (error) {
      setBoardLeads(previousLeads);
      message.error('Не удалось изменить статус лида');
    } finally {
      setUpdatingLeadId(null);
      refetch();
    }
  };

  const getDropStatus = (event: DragEndEvent): LeadStatus | null => {
    if (!event.over) return null;
    const overId = String(event.over.id);
    if (overId === 'new' || overId === 'contacted' || overId === 'qualified' || overId === 'converted' || overId === 'lost') {
      return overId;
    }
    return null;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (readOnly) return;
    if (!event.active || !event.over || updatingLeadId) return;
    const leadId = parseCardId(event.active.id);
    const toStatus = getDropStatus(event);
    if (!leadId || !toStatus) return;
    await handleStatusChange(leadId, toStatus);
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Flex justify="space-between" gap={12} wrap>
        <Input.Search
          placeholder="Поиск по имени, email, телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 420 }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching}>
          Обновить
        </Button>
      </Flex>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <Space align="start" size={16}>
            <KanbanColumn status="new" leads={groupedLeads.new} loading={isLoading} readOnly={readOnly} />
            <KanbanColumn status="contacted" leads={groupedLeads.contacted} loading={isLoading} readOnly={readOnly} />
            <KanbanColumn status="qualified" leads={groupedLeads.qualified} loading={isLoading} readOnly={readOnly} />
            <KanbanColumn status="converted" leads={groupedLeads.converted} loading={isLoading} readOnly={readOnly} />
            <KanbanColumn status="lost" leads={groupedLeads.lost} loading={isLoading} readOnly={readOnly} />
          </Space>
        </div>
      </DndContext>
    </Space>
  );
};
