/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating API keys (includes full key in response).
 */
export type APIKeyCreate = {
    readonly id: string;
    /**
     * Descriptive name for this API key
     */
    name: string;
    readonly key: string;
    readonly key_preview: string;
    /**
     * List of permission scopes for this key
     */
    permissions?: any;
    is_active?: boolean;
    readonly created_at: string;
};

