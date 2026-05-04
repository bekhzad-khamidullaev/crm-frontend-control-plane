/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PatchedVoipRealtimeSettings = {
    readonly id?: number;
    ws_enabled?: boolean;
    ws_url?: string;
    /**
     * token, query_token or none
     */
    ws_auth_mode?: string;
    ws_token?: string;
    ws_reconnect_enabled?: boolean;
    ws_reconnect_max_attempts?: number;
    ws_reconnect_base_delay_ms?: number;
    ws_reconnect_max_delay_ms?: number;
    ws_heartbeat_interval_sec?: number;
    ws_heartbeat_timeout_sec?: number;
    polling_fallback_enabled?: boolean;
    incoming_enabled?: boolean;
    incoming_poll_interval_ms?: number;
    incoming_popup_ttl_ms?: number;
    readonly updated_at?: string;
};

