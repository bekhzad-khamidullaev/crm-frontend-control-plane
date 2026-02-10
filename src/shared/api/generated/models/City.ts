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
    country: number;
    readonly country_name: string | null;
    /**
     * Separate them with commas.
     */
    alternative_names?: string;
};

