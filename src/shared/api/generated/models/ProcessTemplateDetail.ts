/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusinessProcessLifecycleStatusEnum } from './BusinessProcessLifecycleStatusEnum';
import type { ProcessTemplateStep } from './ProcessTemplateStep';
export type ProcessTemplateDetail = {
    readonly id: number;
    code: string;
    name: string;
    description?: string;
    status?: BusinessProcessLifecycleStatusEnum;
    readonly version: number;
    readonly steps: Array<ProcessTemplateStep>;
    readonly active_instances_count: number;
    readonly completed_instances_count: number;
    readonly can_edit: boolean;
    readonly can_launch: boolean;
    creation_date?: string;
    readonly update_date: string;
};

