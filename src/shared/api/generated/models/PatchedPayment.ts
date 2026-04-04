/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaymentStatusEnum } from './PaymentStatusEnum';
/**
 * Serializer for Payment model
 */
export type PatchedPayment = {
    readonly id?: number;
    deal?: number;
    readonly deal_name?: string | null;
    /**
     * without VAT
     */
    amount?: string;
    currency?: number | null;
    readonly currency_name?: string | null;
    readonly currency_code?: string | null;
    readonly deal_currency_name?: string | null;
    readonly deal_currency_code?: string | null;
    payment_date?: string;
    status?: PaymentStatusEnum;
    contract_number?: string;
    invoice_number?: string;
    order_number?: string;
};

