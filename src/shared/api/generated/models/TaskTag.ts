/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Ensures name_ru/name_en/name_uz are always present in API output.
 * If a localized field is empty, falls back to base `name`.
 */
export type TaskTag = {
    readonly id: number;
    readonly name: string;
    readonly name_ru: string;
    readonly name_en: string;
    readonly name_uz: string;
    readonly for_content: number;
};

