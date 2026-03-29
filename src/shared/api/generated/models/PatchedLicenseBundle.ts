/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LicenseBundleStatusEnum } from './LicenseBundleStatusEnum';
export type PatchedLicenseBundle = {
    readonly id?: number;
    code?: string;
    name?: string;
    customer?: number;
    readonly customer_code?: string;
    readonly customer_name?: string;
    deployment?: number | null;
    readonly deployment_instance_id?: string;
    subscription?: number | null;
    readonly subscription_plan_code?: string;
    readonly subscription_status?: string;
    owner?: number | null;
    readonly owner_username?: string;
    support_owner?: number | null;
    readonly support_owner_username?: string;
    status?: LicenseBundleStatusEnum;
    renewed_until?: string | null;
    support_until?: string | null;
    notes?: string;
    readonly created_at?: string;
    readonly updated_at?: string;
};

