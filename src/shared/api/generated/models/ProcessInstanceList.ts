/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Status08fEnum } from './Status08fEnum';
export type ProcessInstanceList = {
    readonly id: number;
    template: number;
    readonly template_name: string;
    readonly version: number;
    status?: Status08fEnum;
    current_step_no?: number;
    started_at?: string;
    completed_at?: string | null;
    context_type?: string;
    context_id?: string;
    context_payload?: any;
    readonly can_advance: string;
    readonly can_cancel: string;
    readonly is_participant: string;
};

