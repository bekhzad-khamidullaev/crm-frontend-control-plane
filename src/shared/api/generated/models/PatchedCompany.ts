/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Mixin to add validation helpers to serializers
 */
export type PatchedCompany = {
    readonly id?: number;
    full_name?: string;
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
    tags?: Array<number>;
    token?: string;
    was_in_touch?: string | null;
    owner?: number | null;
    department?: number | null;
    readonly creation_date?: string;
    readonly update_date?: string;
};

