/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for security settings.
 */
export type PatchedSecuritySettings = {
    readonly id?: number;
    /**
     * One IP address per line. Leave blank to allow all.
     */
    ip_whitelist?: string;
    /**
     * Return IP whitelist as a list.
     */
    readonly ip_whitelist_list?: Array<string>;
    /**
     * Maximum API requests per minute
     */
    rate_limit?: number;
    /**
     * Require two-factor authentication for all users
     */
    require_2fa?: boolean;
    /**
     * Automatic logout after N minutes of inactivity
     */
    session_timeout?: number;
    /**
     * Return password policy as a dict.
     */
    readonly password_policy?: Record<string, (number | boolean)>;
    /**
     * Return login security settings as a dict.
     */
    readonly login_security?: Record<string, number>;
    readonly updated_at?: string;
};

