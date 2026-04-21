/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentChannelVariant } from './ContentChannelVariant';
import type { WorkflowStageEnum } from './WorkflowStageEnum';
export type ContentItem = {
    readonly id: number;
    plan: number;
    readonly plan_name: string;
    title: string;
    brief?: string;
    objective?: string;
    priority?: number;
    planned_at?: string | null;
    due_at?: string | null;
    published_at?: string | null;
    workflow_stage?: WorkflowStageEnum;
    assignee_copy?: number | null;
    readonly assignee_copy_name: string;
    assignee_design?: number | null;
    readonly assignee_design_name: string;
    assignee_approver?: number | null;
    readonly assignee_approver_name: string;
    template?: number | null;
    readonly template_name: string;
    readonly external_ref: string;
    version?: number;
    readonly created_by: number | null;
    readonly updated_by: number | null;
    readonly created_at: string;
    readonly updated_at: string;
    readonly channel_variants: Array<ContentChannelVariant>;
    readonly pending_approval: Record<string, any>;
    readonly sla_hours: number;
    readonly sla_deadline_at: string;
    readonly sla_breached: boolean;
};

