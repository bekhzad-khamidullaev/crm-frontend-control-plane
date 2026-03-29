/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for City model
 */
export type City = {
    readonly id: number;
    name: string;
    name_ru?: string;
    name_en?: string;
    name_uz?: string;
    country: number;
    readonly country_name: string | null;
    readonly country_name_ru: string;
    readonly country_name_en: string;
    readonly country_name_uz: string;
    /**
     * Separate them with commas.
     */
    alternative_names?: string;
};

