/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LicenseActionAuditActionEnum } from './LicenseActionAuditActionEnum';
export type PatchedLicenseActionAudit = {
    readonly id?: number;
    action?: LicenseActionAuditActionEnum;
    readonly created_at?: string;
    details?: any;
    actor?: number | null;
    readonly actor_username?: string;
    license_issue?: number | null;
    readonly license_id?: string;
    readonly deployment_instance_id?: string;
};

