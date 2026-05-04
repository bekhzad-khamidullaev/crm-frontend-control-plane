/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusinessProcessLifecycleStatusEnum } from './BusinessProcessLifecycleStatusEnum';
export type ProcessTemplateList = {
    readonly id: number;
    code: string;
    name: string;
    description?: string;
    status?: BusinessProcessLifecycleStatusEnum;
    readonly steps_count: number;
    readonly version: number;
    readonly active_instances_count: number;
    readonly completed_instances_count: number;
    readonly can_edit: boolean;
    readonly can_launch: boolean;
    readonly update_date: string;
};

