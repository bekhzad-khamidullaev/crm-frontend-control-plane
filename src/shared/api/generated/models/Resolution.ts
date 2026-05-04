/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Ensures name_ru/name_en/name_uz are always present in API output.
 * If a localized field is empty, falls back to base `name`.
 */
export type Resolution = {
    readonly id: number;
    name: string;
    name_ru?: string;
    name_en?: string;
    name_uz?: string;
    index_number?: number;
};

