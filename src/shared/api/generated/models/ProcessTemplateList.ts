/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatusA5eEnum } from './StatusA5eEnum';
export type ProcessTemplateList = {
    readonly id: number;
    code: string;
    name: string;
    description?: string;
    status?: StatusA5eEnum;
    readonly steps_count: string;
    readonly version: number;
    readonly active_instances_count: number;
    readonly completed_instances_count: number;
    readonly can_edit: string;
    readonly can_launch: string;
    readonly update_date: string;
};

