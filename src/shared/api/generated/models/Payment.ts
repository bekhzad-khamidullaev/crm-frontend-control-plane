/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaymentStatusEnum } from './PaymentStatusEnum';
/**
 * Serializer for Payment model
 */
export type Payment = {
    readonly id: number;
    deal: number;
    readonly deal_name: string | null;
    /**
     * without VAT
     */
    amount?: string;
    currency?: number | null;
    readonly currency_name: string | null;
    payment_date?: string;
    status?: PaymentStatusEnum;
    contract_number?: string;
    invoice_number?: string;
    order_number?: string;
};

