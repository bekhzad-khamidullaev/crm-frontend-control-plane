/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssigneeTypeEnum } from './AssigneeTypeEnum';
export type ProcessTemplateStep = {
    readonly id: number;
    order_no: number;
    name: string;
    description?: string;
    assignee_type: AssigneeTypeEnum;
    assignee_user?: number | null;
    assignee_group?: number | null;
    next_step_order_no?: number | null;
    transition_rule_json?: any;
    sla_target_hours?: number | null;
};

