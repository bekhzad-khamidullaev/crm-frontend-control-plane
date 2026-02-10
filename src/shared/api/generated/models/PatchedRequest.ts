/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Request (tickets/inquiries) model
 */
export type PatchedRequest = {
    readonly id?: number;
    readonly ticket?: string;
    description?: string;
    owner?: number | null;
    readonly owner_name?: string | null;
    company?: number | null;
    readonly company_name?: string | null;
    contact?: number | null;
    readonly contact_name?: string | null;
    lead?: number | null;
    readonly lead_name?: string | null;
    email?: string;
    /**
     * The name of the contact person (one word).
     */
    first_name?: string;
    /**
     * The middle name of the contact person.
     */
    middle_name?: string;
    /**
     * The last name of the contact person (one word).
     */
    last_name?: string;
    phone?: string;
    country?: number | null;
    /**
     * Object of City in database
     */
    city?: number | null;
    readonly creation_date?: string;
    readonly update_date?: string;
};

