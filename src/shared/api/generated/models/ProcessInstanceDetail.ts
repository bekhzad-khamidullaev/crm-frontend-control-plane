/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusinessProcessInstanceStatusEnum } from './BusinessProcessInstanceStatusEnum';
import type { ProcessEventLog } from './ProcessEventLog';
import type { ProcessInstanceStep } from './ProcessInstanceStep';
export type ProcessInstanceDetail = {
    readonly id: number;
    template: number;
    readonly template_name: string;
    readonly version: number;
    status?: BusinessProcessInstanceStatusEnum;
    current_step_no?: number;
    started_at?: string;
    completed_at?: string | null;
    context_type?: string;
    context_id?: string;
    context_payload?: any;
    readonly steps: Array<ProcessInstanceStep>;
    readonly events: Array<ProcessEventLog>;
    readonly can_advance: boolean;
    readonly can_cancel: boolean;
    readonly is_participant: boolean;
};

