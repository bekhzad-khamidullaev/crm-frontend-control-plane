/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataRetentionPolicyActionEnum } from './DataRetentionPolicyActionEnum';
import type { EntityEnum } from './EntityEnum';
export type DataRetentionPolicy = {
    readonly id: number;
    name: string;
    entity: EntityEnum;
    retention_days: number;
    action?: DataRetentionPolicyActionEnum;
    is_active?: boolean;
    readonly last_run_at: string | null;
    readonly created_by: number | null;
    readonly created_at: string;
    readonly updated_at: string;
};

