/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConsentRecordStatusEnum } from './ConsentRecordStatusEnum';
import type { LegalBasisEnum } from './LegalBasisEnum';
export type PatchedConsentRecord = {
    readonly id?: number;
    /**
     * Collection source, e.g. web_form, call_center
     */
    source?: string;
    /**
     * Processing purpose, e.g. marketing, support
     */
    purpose?: string;
    legal_basis?: LegalBasisEnum;
    status?: ConsentRecordStatusEnum;
    subject_content_type?: number;
    subject_object_id?: number;
    readonly subject_type?: string;
    metadata?: any;
    granted_at?: string;
    revoked_at?: string | null;
    expires_at?: string | null;
    readonly created_by?: number | null;
    readonly created_at?: string;
    readonly updated_at?: string;
};

