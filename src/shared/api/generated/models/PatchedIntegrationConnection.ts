/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntegrationConnectionStatusEnum } from './IntegrationConnectionStatusEnum';
import type { IntegrationProviderEnum } from './IntegrationProviderEnum';
export type PatchedIntegrationConnection = {
    readonly id?: number;
    readonly owner?: number | null;
    provider?: IntegrationProviderEnum;
    account_id?: string;
    access_token_enc?: string;
    refresh_token_enc?: string;
    scopes?: string;
    status?: IntegrationConnectionStatusEnum;
    expires_at?: string | null;
    readonly created_at?: string;
    readonly updated_at?: string;
};

