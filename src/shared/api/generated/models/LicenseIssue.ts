/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LicenseIssue = {
    readonly id: number;
    license_id?: string;
    subscription: number;
    deployment: number;
    payload_json?: any;
    signature: string;
    key_id?: string;
    readonly issued_at: string;
    is_revoked?: boolean;
    revoked_at?: string | null;
    revoked_by?: number | null;
    revoke_reason?: string;
};

