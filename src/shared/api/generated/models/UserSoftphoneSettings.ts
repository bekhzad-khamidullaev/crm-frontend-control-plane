/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserSoftphoneSettings = {
    display_name?: string;
    sip_ws_uri?: string;
    sip_uri?: string;
    webrtc_stun_servers?: string;
    webrtc_turn_enabled?: boolean | null;
    webrtc_turn_server?: string;
    webrtc_turn_username?: string;
    webrtc_turn_password?: string;
    readonly sip_username: string;
    readonly sip_realm: string;
    readonly extension: string;
    readonly outbound_mode: string;
};

