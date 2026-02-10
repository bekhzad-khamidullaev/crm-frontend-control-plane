/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NullEnum } from './NullEnum';
import type { ProductTypeEnum } from './ProductTypeEnum';
/**
 * Serializer for Product model
 */
export type PatchedProduct = {
    readonly id?: number;
    name?: string;
    description?: string;
    product_category?: number | null;
    readonly category_name?: string | null;
    price?: string | null;
    currency?: number | null;
    readonly currency_name?: string | null;
    type?: (ProductTypeEnum | NullEnum) | null;
    on_sale?: boolean;
};

