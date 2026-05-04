/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlankEnum } from './BlankEnum';
import type { TelephonyProviderEnum } from './TelephonyProviderEnum';
import type { TelephonyRouteModeEnum } from './TelephonyRouteModeEnum';
export type VoipRoutingSettings = {
    readonly id: number;
    /**
     * Global outbound call routing mode for CRM browser telephony.
     *
     * * `embedded` - AMI-managed PBX routing
     * * `bridge` - Управление вызовом через PBX
     */
    telephony_route_mode?: (TelephonyRouteModeEnum | BlankEnum);
    /**
     * Global preferred provider for outbound calls
     *
     * * `Asterisk` - Asterisk
     */
    telephony_provider?: (TelephonyProviderEnum | BlankEnum);
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

