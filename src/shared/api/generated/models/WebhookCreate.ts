/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating webhooks (includes secret in response).
 */
export type WebhookCreate = {
    readonly id: string;
    /**
     * The URL to send webhook POST requests to
     */
    url: string;
    /**
     * List of events that trigger this webhook
     */
    events?: any;
    /**
     * Secret key for HMAC signature verification
     */
    readonly secret: string;
    is_active?: boolean;
    readonly created_at: string;
};

