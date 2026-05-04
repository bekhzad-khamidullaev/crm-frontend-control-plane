/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for active user sessions.
 */
export type ActiveSession = {
    /**
     * Django session key or JWT token ID
     */
    readonly session_key: string;
    readonly user_id: number;
    readonly user_email: string;
    readonly ip_address: string | null;
    readonly user_agent: string;
    /**
     * Browser and OS information
     */
    readonly device_name: string;
    readonly last_activity: string;
    readonly created_at: string;
};

