/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoyaltyImportJobStatusEnum } from './LoyaltyImportJobStatusEnum';
export type LoyaltyImportJob = {
    readonly id: number;
    source?: string;
    status?: LoyaltyImportJobStatusEnum;
    payload?: any;
    readonly replay_of_id: number;
    started_at?: string | null;
    finished_at?: string | null;
    total_rows?: number;
    success_rows?: number;
    failed_rows?: number;
    error_log?: any;
    creation_date?: string;
    readonly update_date: string;
};

