/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DefaultChannelEnum } from './DefaultChannelEnum';
/**
 * Mixin to add validation helpers to serializers
 */
export type Company = {
    readonly id: number;
    full_name: string;
    /**
     * Separate them with commas.
     */
    alternative_names?: string;
    website?: string;
    active?: boolean;
    phone?: string;
    city_name?: string;
    city?: number | null;
    /**
     * Registration number of Company
     */
    registration_number?: string;
    legal_stir?: string;
    legal_mfo?: string;
    legal_account?: string;
    legal_bank_name?: string;
    legal_signer_name?: string;
    legal_signer_position?: string;
    legal_signing_basis?: string;
    /**
     * Company Country
     */
    country?: number | null;
    type?: number | null;
    industry?: Array<number>;
    address?: string;
    region?: string;
    district?: string;
    description?: string;
    disqualified?: boolean;
    /**
     * Use comma to separate Emails.
     */
    email?: string;
    lead_source?: number | null;
    /**
     * Mailing list recipient.
     */
    massmail?: boolean;
    default_channel?: DefaultChannelEnum;
    tags?: Array<number>;
    token?: string;
    was_in_touch?: string | null;
    owner?: number | null;
    readonly owner_name: string | null;
    department?: number | null;
    readonly available_channels: Array<string>;
    readonly channel_targets: Record<string, any>;
    readonly channel_discovered_at: string;
    readonly creation_date: string;
    readonly update_date: string;
};

