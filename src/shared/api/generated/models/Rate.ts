/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RateTypeEnum } from './RateTypeEnum';
/**
 * Serializer for Currency Rate model
 */
export type Rate = {
    readonly id: number;
    currency: number;
    readonly currency_name: string | null;
    readonly currency_code: string | null;
    payment_date?: string;
    /**
     * Exchange rate against the state currency.
     */
    rate_to_state_currency: string;
    /**
     * Exchange rate against the state currency.
     */
    rate_to_marketing_currency: string;
    rate_type?: RateTypeEnum;
};

