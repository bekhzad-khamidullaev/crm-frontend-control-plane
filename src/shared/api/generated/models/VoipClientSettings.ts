/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type VoipClientSettings = {
    readonly id: number;
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
    readonly updated_at: string;
};

