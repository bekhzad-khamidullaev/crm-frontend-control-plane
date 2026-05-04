/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DefaultLanguageEnum } from './DefaultLanguageEnum';
/**
 * Serializer for general system settings.
 */
export type PatchedSystemSettings = {
    readonly id?: number;
    company_name?: string;
    company_email?: string;
    company_phone?: string;
    company_legal_address?: string;
    company_signer_name?: string;
    company_signer_position?: string;
    company_signing_basis?: string;
    company_stir?: string;
    company_mfo?: string;
    company_bank_name?: string;
    company_account?: string;
    default_language?: DefaultLanguageEnum;
    timezone?: string;
    readonly created_at?: string;
    readonly updated_at?: string;
};

