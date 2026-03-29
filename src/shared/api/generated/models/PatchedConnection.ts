/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConnectionTypeEnum } from './ConnectionTypeEnum';
import type { Provider8a3Enum } from './Provider8a3Enum';
export type PatchedConnection = {
    readonly id?: number;
    /**
     * Specify VoIP service provider
     *
     * * `Asterisk` - Asterisk
     */
    provider?: Provider8a3Enum;
    type?: ConnectionTypeEnum;
    number?: string;
    /**
     * SIP domain or host for SIP trunk/account connections
     */
    sip_server?: string;
    owner?: number | null;
    readonly owner_name?: string;
    /**
     * Specify the number to be displayed as             your phone number when you call
     */
    callerid?: string;
    active?: boolean;
};

