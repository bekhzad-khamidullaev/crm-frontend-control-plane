/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Agent presence status with SIP registration state.
 */
export type AgentPresence = {
    user_id: number;
    username: string;
    extension: string;
    is_online: boolean;
    is_in_call: boolean;
    current_call_id: number | null;
    current_call_status: string;
};

