/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssigneeTypeEnum } from './AssigneeTypeEnum';
import type { ProcessInstanceStepStatusEnum } from './ProcessInstanceStepStatusEnum';
import type { ProcessInstanceTask } from './ProcessInstanceTask';
export type ProcessInstanceStep = {
    readonly id: number;
    order_no: number;
    name_snapshot: string;
    description_snapshot?: string;
    assignee_type: AssigneeTypeEnum;
    assignee_user?: number | null;
    assignee_group?: number | null;
    status?: ProcessInstanceStepStatusEnum;
    started_at?: string | null;
    completed_at?: string | null;
    sla_target_hours_snapshot?: number | null;
    due_at?: string | null;
    overdue_since?: string | null;
    readonly tasks: Array<ProcessInstanceTask>;
};

