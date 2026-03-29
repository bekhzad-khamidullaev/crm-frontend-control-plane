/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Customer = {
    readonly id: number;
    code: string;
    legal_name: string;
    contact_email?: string;
    is_active?: boolean;
    readonly created_at: string;
    readonly updated_at: string;
    readonly deployments_total: number;
    readonly deployments_unlicensed: number;
    readonly subscriptions_active: number;
    readonly last_runtime_request_at: string | null;
};

