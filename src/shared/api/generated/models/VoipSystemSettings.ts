/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlankEnum } from './BlankEnum';
import type { TelephonyProviderEnum } from './TelephonyProviderEnum';
import type { TelephonyRouteModeEnum } from './TelephonyRouteModeEnum';
export type VoipSystemSettings = {
    readonly id: number;
    ami_host?: string;
    ami_port?: number;
    ami_username?: string;
    /**
     * Stored in plain text in DB; restrict admin access.
     */
    ami_secret?: string;
    ami_use_ssl?: boolean;
    ami_connect_timeout?: number;
    ami_reconnect_delay?: number;
    incoming_enabled?: boolean;
    incoming_poll_interval_ms?: number;
    incoming_popup_ttl_ms?: number;
    /**
     * Global outbound call routing mode for CRM
     *
     * * `embedded` - Embedded Asterisk (CRM-managed)
     * * `bridge` - External Asterisk via PBX Bridge
     */
    telephony_route_mode?: (TelephonyRouteModeEnum | BlankEnum);
    /**
     * Global preferred provider for outbound calls
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
    /**
     * Forward webhook payload to external URL when no CRM objects are matched
     */
    forward_unknown_calls?: boolean;
    forward_url?: string;
    /**
     * Optional: restrict forwarding source IP check (for relayed requests)
     */
    forwarding_allowed_ip?: string;
    readonly updated_at: string;
};

