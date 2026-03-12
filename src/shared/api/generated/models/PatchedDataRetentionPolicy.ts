/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActionEnum } from './ActionEnum';
import type { EntityEnum } from './EntityEnum';
export type PatchedDataRetentionPolicy = {
    readonly id?: number;
    name?: string;
    entity?: EntityEnum;
    retention_days?: number;
    action?: ActionEnum;
    is_active?: boolean;
    readonly last_run_at?: string | null;
    readonly created_by?: number | null;
    readonly created_at?: string;
    readonly updated_at?: string;
};

