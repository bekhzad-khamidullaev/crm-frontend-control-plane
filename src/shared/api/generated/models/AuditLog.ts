/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthTypeEnum } from './AuthTypeEnum';
/**
 * Serializer for security audit logs.
 */
export type AuditLog = {
    readonly id: number;
    readonly user_id: number | null;
    readonly user_email: string | null;
    /**
     * Username attempted (stored even if auth failed)
     */
    readonly username: string;
    readonly auth_type: AuthTypeEnum;
    /**
     * API endpoint accessed
     */
    readonly endpoint: string;
    readonly method: string;
    readonly success: boolean;
    readonly ip_address: string | null;
    readonly user_agent: string;
    readonly timestamp: string;
    /**
     * Return additional details as JSON.
     */
    readonly details: Record<string, string>;
};

