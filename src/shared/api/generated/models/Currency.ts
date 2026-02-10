/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Currency model
 */
export type Currency = {
    readonly id: number;
    /**
     * Alphabetic Code for the Representation of Currencies.
     */
    name: string;
    auto_update?: boolean;
    /**
     * Exchange rate against the state currency.
     */
    rate_to_state_currency?: string;
    /**
     * Exchange rate against the state currency.
     */
    rate_to_marketing_currency?: string;
};

