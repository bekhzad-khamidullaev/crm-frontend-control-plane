/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for LeadSource model
 */
export type LeadSource = {
    readonly id: number;
    name: string;
    name_ru?: string;
    name_en?: string;
    name_uz?: string;
    /**
     * Override default first-response SLA hours for this source.
     */
    sla_hours?: number | null;
};

