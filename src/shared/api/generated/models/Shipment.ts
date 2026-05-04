/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Shipment model (proxy of Output, only shipped items)
 */
export type Shipment = {
    readonly id: number;
    deal: number;
    readonly deal_name: string | null;
    product: number;
    readonly product_name: string | null;
    quantity?: number;
    /**
     * without VAT
     */
    amount?: string;
    currency?: number | null;
    readonly currency_name: string | null;
    readonly currency_code: string | null;
    /**
     * Shipment date as per contract
     */
    shipping_date?: string | null;
    planned_shipping_date?: string | null;
    /**
     * Date when the product was shipped
     */
    actual_shipping_date?: string | null;
    /**
     * Product is shipped
     */
    product_is_shipped?: boolean;
    serial_number?: string;
};

