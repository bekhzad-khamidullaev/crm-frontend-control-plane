/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Mixin to add validation helpers to serializers
 */
export type PatchedDealWrite = {
    /**
     * Deal name
     */
    name?: string;
    /**
     * Describe briefly what needs to be done in the next step.
     */
    next_step?: string;
    /**
     * Date to which the next step should be taken.
     */
    next_step_date?: string;
    description?: string;
    stage?: number | null;
    closing_date?: string | null;
    win_closing_date?: string | null;
    /**
     * Total deal amount without VAT
     */
    amount?: string | null;
    currency?: number | null;
    closing_reason?: number | null;
    probability?: number | null;
    city?: number | null;
    /**
     * Country
     */
    country?: number | null;
    lead?: number | null;
    contact?: number | null;
    request?: number | null;
    company?: number | null;
    /**
     * Contact person of dealer or distribution company
     */
    partner_contact?: number | null;
    relevant?: boolean;
    active?: boolean;
    important?: boolean;
    tags?: Array<number>;
    is_new?: boolean;
    remind_me?: boolean;
    owner?: number | null;
    co_owner?: number | null;
    department?: number | null;
};

