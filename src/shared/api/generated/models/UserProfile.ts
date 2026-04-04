/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TelephonyProviderEnum } from './TelephonyProviderEnum';
import type { TelephonyRouteModeEnum } from './TelephonyRouteModeEnum';
/**
 * Serializer for UserProfile model
 */
export type UserProfile = {
    readonly user: number;
    readonly username: string;
    email?: string;
    full_name?: string;
    /**
     * User profile picture (max 5MB)
     */
    readonly avatar: string | null;
    readonly avatar_url: string;
    pbx_number?: string;
    utc_timezone?: string;
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
    readonly jssip_sip_password: string;
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
    readonly telephony_route_mode: TelephonyRouteModeEnum;
    /**
     * Used by server originate mode
     *
     * * `Asterisk` - Asterisk
     */
    readonly telephony_provider: TelephonyProviderEnum;
    /**
     * Comma or newline separated STUN URLs
     */
    readonly webrtc_stun_servers: string;
    readonly webrtc_turn_enabled: boolean;
    /**
     * Example: turn:turn.example.com:3478?transport=udp
     */
    readonly webrtc_turn_server: string;
    readonly webrtc_turn_username: string;
    readonly webrtc_turn_password: string;
};

