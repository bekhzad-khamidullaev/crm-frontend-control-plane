/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatusA5eEnum } from './StatusA5eEnum';
export type ProcessTemplateDetail = {
    readonly id: number;
    code: string;
    name: string;
    description?: string;
    status?: StatusA5eEnum;
    readonly version: number;
    readonly steps: string;
    readonly active_instances_count: string;
    readonly completed_instances_count: string;
    readonly can_edit: string;
    readonly can_launch: string;
    creation_date?: string;
    readonly update_date: string;
};

