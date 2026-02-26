/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for API keys (list/retrieve).
 */
export type APIKey = {
    readonly id: string;
    /**
     * Descriptive name for this API key
     */
    name: string;
    readonly key_preview: string;
    /**
     * List of permission scopes for this key
     */
    permissions?: any;
    is_active?: boolean;
    readonly created_at: string;
    readonly last_used: string | null;
    readonly usage_count: number;
};

