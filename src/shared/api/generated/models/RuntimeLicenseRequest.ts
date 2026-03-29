/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RuntimeLicenseRequestStatusEnum } from './RuntimeLicenseRequestStatusEnum';
export type RuntimeLicenseRequest = {
    readonly id: number;
    instance_id: string;
    deployment?: number | null;
    subscription?: number | null;
    status?: RuntimeLicenseRequestStatusEnum;
    request_payload?: any;
    review_note?: string;
    reviewed_by?: number | null;
    reviewed_at?: string | null;
    issued_license?: number | null;
    issued_at?: string | null;
    installed_at?: string | null;
    readonly created_at: string;
    readonly updated_at: string;
    readonly deployment_instance_id: string;
    readonly customer_id: number;
    readonly customer_name: string;
    readonly customer_code: string;
    readonly subscription_plan_code: string;
};

