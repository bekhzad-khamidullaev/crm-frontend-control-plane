/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for webhooks (list/retrieve - secret is masked).
 */
export type PatchedWebhook = {
    readonly id?: string;
    /**
     * The URL to send webhook POST requests to
     */
    url?: string;
    /**
     * List of events that trigger this webhook
     */
    events?: any;
    /**
     * Return masked preview of secret.
     */
    readonly secret_preview?: string | null;
    is_active?: boolean;
    readonly created_at?: string;
    readonly last_triggered?: string | null;
    readonly success_count?: number;
    readonly failure_count?: number;
};

