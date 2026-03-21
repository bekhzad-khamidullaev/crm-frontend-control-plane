/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlankEnum } from './BlankEnum';
import type { TelephonyProviderEnum } from './TelephonyProviderEnum';
import type { TelephonyRouteModeEnum } from './TelephonyRouteModeEnum';
import type { UtcTimezoneEnum } from './UtcTimezoneEnum';
/**
 * Serializer for UserProfile model
 */
export type PatchedUserProfile = {
    readonly user?: number;
    readonly username?: string;
    readonly email?: string;
    readonly full_name?: string;
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
    /**
     * How outbound calls should be routed from the CRM UI
     *
     * * `embedded` - Embedded Asterisk (CRM-managed)
     * * `bridge` - External Asterisk via PBX Bridge
     */
    telephony_route_mode?: (TelephonyRouteModeEnum | BlankEnum);
    /**
     * Used by server originate mode
     *
     * * `Asterisk` - Asterisk
     */
    telephony_provider?: (TelephonyProviderEnum | BlankEnum);
    /**
     * Comma or newline separated STUN URLs
     */
    webrtc_stun_servers?: string;
    webrtc_turn_enabled?: boolean;
    /**
     * Example: turn:turn.example.com:3478?transport=udp
     */
    webrtc_turn_server?: string;
    webrtc_turn_username?: string;
    webrtc_turn_password?: string;
};
