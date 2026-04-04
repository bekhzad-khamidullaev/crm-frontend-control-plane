/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WarehouseItemStatusEnum } from './WarehouseItemStatusEnum';
export type WarehouseItem = {
    readonly id: number;
    name: string;
    sku?: string;
    category?: string;
    location?: string;
    unit?: string;
    quantity?: string;
    min_quantity?: string;
    unit_cost?: string;
    status?: WarehouseItemStatusEnum;
    note?: string;
    owner?: number | null;
    readonly creation_date: string;
    readonly update_date: string;
};

