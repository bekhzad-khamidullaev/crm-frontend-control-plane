/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for ClosingReason model
 */
export type ClosingReason = {
    readonly id: number;
    name: string;
    /**
     * Reason rating.         The indices of other instances will be sorted automatically.
     */
    index_number: number;
    success_reason?: boolean;
};

