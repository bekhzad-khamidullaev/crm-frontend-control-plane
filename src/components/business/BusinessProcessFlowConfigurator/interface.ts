export interface BusinessProcessFlowNode {
  id: string;
  orderNo: number;
  title: string;
  subtitle?: string;
  nextLabel?: string;
  hasCondition?: boolean;
  assigneeLabel?: string;
  slaLabel?: string;
  conditionLabel?: string;
}

export interface BusinessProcessFlowConfiguratorProps {
  nodes: BusinessProcessFlowNode[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onReorder?: (activeId: string, overId: string) => void;
}
