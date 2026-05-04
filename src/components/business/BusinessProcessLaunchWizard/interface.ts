export interface BusinessProcessLaunchEntityOption {
  value: number;
  label: string;
  meta?: string;
  entity?: Record<string, any>;
}

export interface BusinessProcessLaunchTemplateStep {
  id: number;
  order_no: number;
  name: string;
  description?: string;
  next_step_order_no?: number | null;
  transition_rule_json?: Record<string, any>;
  sla_target_hours?: number | null;
}

export interface BusinessProcessLaunchTemplate {
  id: number;
  name: string;
  description?: string;
  version?: number;
  steps?: BusinessProcessLaunchTemplateStep[];
}

export interface BusinessProcessLaunchPayload {
  context_type: string;
  context_id: string;
  context_payload: Record<string, any>;
}

export interface BusinessProcessLaunchInitialContext {
  contextType?: string;
  contextId?: string;
}

interface BusinessProcessLaunchWizardProps {
  open: boolean;
  loading?: boolean;
  submitting?: boolean;
  template?: BusinessProcessLaunchTemplate | null;
  entityOptionsByType: Record<string, BusinessProcessLaunchEntityOption[]>;
  initialContext?: BusinessProcessLaunchInitialContext | null;
  onCancel: () => void;
  onSubmit: (payload: BusinessProcessLaunchPayload) => Promise<void> | void;
}

export type {
  BusinessProcessLaunchWizardProps,
};
