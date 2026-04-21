/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlankEnum } from './BlankEnum';
import type { TelephonyEventModeEnum } from './TelephonyEventModeEnum';
export type VoipSystemSettings = {
    readonly id: number;
    /**
     * bridge: CRM receives events from the Go connector webhook; ami: CRM receives events from direct AMI ingest
     *
     * * `bridge` - Direct AMI ingest
     * * `ami` - Direct AMI ingest
     */
    telephony_event_mode?: (TelephonyEventModeEnum | BlankEnum);
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
    /**
     * Secret token for the Go connector to authenticate webhooks.
     */
    internal_api_token?: string;
    /**
     * Comma or newline separated list of IP addresses allowed to call connector webhook endpoints. Leave empty to rely on token auth only (allow all IPs).
     */
    connector_allowed_ips?: string;
    readonly updated_at: string;
};

