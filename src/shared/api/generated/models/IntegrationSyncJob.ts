/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntegrationProviderEnum } from './IntegrationProviderEnum';
import type { IntegrationSyncJobDirectionEnum } from './IntegrationSyncJobDirectionEnum';
import type { IntegrationSyncJobStatusEnum } from './IntegrationSyncJobStatusEnum';
export type IntegrationSyncJob = {
    readonly id: number;
    readonly owner: number | null;
    provider: IntegrationProviderEnum;
    direction: IntegrationSyncJobDirectionEnum;
    entity_type: string;
    entity_id: string;
    idempotency_key: string;
    readonly attempt: number;
    readonly status: IntegrationSyncJobStatusEnum;
    readonly next_retry_at: string | null;
    readonly last_error: string;
    payload_json?: any;
    readonly created_at: string;
    readonly updated_at: string;
};

