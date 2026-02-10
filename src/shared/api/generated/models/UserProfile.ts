/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlankEnum } from './BlankEnum';
import type { UtcTimezoneEnum } from './UtcTimezoneEnum';
/**
 * Serializer for UserProfile model
 */
export type UserProfile = {
    readonly user: number;
    readonly username: string;
    readonly email: string;
    readonly full_name: string;
    pbx_number?: string;
    utc_timezone?: (UtcTimezoneEnum | BlankEnum);
    activate_timezone?: boolean;
    language_code?: string;
    /**
     * Example: wss://sip.example.com:7443
     */
    jssip_ws_uri?: string;
    /**
     * Example: sip:1001@sip.example.com
     */
    jssip_sip_uri?: string;
    /**
     * Will be used by the web client
     */
    jssip_sip_password?: string;
    /**
     * Name shown to the callee
     */
    jssip_display_name?: string;
};

