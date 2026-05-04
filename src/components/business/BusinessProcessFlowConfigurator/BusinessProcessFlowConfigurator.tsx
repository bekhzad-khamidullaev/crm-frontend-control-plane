import { DragOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Empty, Space, Tag, Typography } from 'antd';
import type { BusinessProcessFlowConfiguratorProps, BusinessProcessFlowNode } from './interface';
import './index.css';

const { Text } = Typography;

interface SortableFlowNodeProps {
  node: BusinessProcessFlowNode;
  selected: boolean;
  onSelect?: (id: string) => void;
}

function SortableFlowNode({ node, selected, onSelect }: SortableFlowNodeProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });

  return (
    <div
      ref={setNodeRef}
      className={`component_BusinessProcessFlowConfigurator_Node ${selected ? 'is-selected' : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        boxShadow: isDragging ? '0 10px 22px rgba(22,119,255,0.18)' : undefined,
      }}
    >
      <Space className="component_BusinessProcessFlowConfigurator_NodeMain" align="start" size={12}>
        <Button
          type="text"
          size="small"
          icon={<DragOutlined />}
          {...attributes}
          {...listeners}
          className="component_BusinessProcessFlowConfigurator_DragHandle"
        />

        <button
          type="button"
          onClick={() => onSelect?.(node.id)}
          className="component_BusinessProcessFlowConfigurator_NodeButton"
        >
          <Space size={8} align="center" wrap>
            <Tag color="blue" bordered={false}>
              Шаг {node.orderNo}
            </Tag>
            {node.hasCondition ? (
              <Tag color="gold" icon={<NodeIndexOutlined />} bordered={false}>
                Условный переход
              </Tag>
            ) : null}
          </Space>

          <Text strong className="component_BusinessProcessFlowConfigurator_Title">
            {node.title || `Шаг ${node.orderNo}`}
          </Text>
          <Text type="secondary" className="component_BusinessProcessFlowConfigurator_Subtitle">
            {node.subtitle || node.nextLabel || 'Переход не настроен'}
          </Text>
          <Space size={6} wrap className="component_BusinessProcessFlowConfigurator_Meta">
            {node.assigneeLabel ? <Tag bordered={false}>{node.assigneeLabel}</Tag> : null}
            {node.slaLabel ? (
              <Tag color="orange" bordered={false}>
                {node.slaLabel}
              </Tag>
            ) : null}
            {node.nextLabel ? (
              <Tag color="cyan" bordered={false}>
                {node.nextLabel}
              </Tag>
            ) : null}
            {node.conditionLabel ? (
              <Tag color="gold" bordered={false}>
                {node.conditionLabel}
              </Tag>
            ) : null}
          </Space>
        </button>
      </Space>
    </div>
  );
}

export default function BusinessProcessFlowConfigurator({
  nodes,
  selectedId,
  onSelect,
  onReorder,
}: BusinessProcessFlowConfiguratorProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (!nodes.length) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Добавьте первый шаг процесса" />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return;
        onReorder?.(String(active.id), String(over.id));
      }}
    >
      <SortableContext items={nodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {nodes.map((node) => (
            <SortableFlowNode
              key={node.id}
              node={node}
              selected={String(selectedId || '') === String(node.id)}
              onSelect={onSelect}
            />
          ))}
        </Space>
      </SortableContext>
    </DndContext>
  );
}
