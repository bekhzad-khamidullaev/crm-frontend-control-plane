/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CallControlRequest = {
    /**
     * VoIP CallLog session_id
     */
    call_id?: string;
    /**
     * Asterisk channel name
     */
    channel?: string;
    context?: string;
    /**
     * Target extension or number
     */
    exten: string;
    priority?: string;
};

