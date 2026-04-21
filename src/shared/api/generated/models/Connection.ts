/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConnectionTypeEnum } from './ConnectionTypeEnum';
import type { TelephonyProviderEnum } from './TelephonyProviderEnum';
export type Connection = {
    readonly id: number;
    /**
     * Specify VoIP service provider
     *
     * * `Asterisk` - Asterisk
     */
    provider?: TelephonyProviderEnum;
    readonly type: ConnectionTypeEnum;
    number: string;
    /**
     * SIP domain or host for SIP trunk/account connections
     */
    readonly sip_server: string;
    owner?: number | null;
    readonly owner_name: string;
    /**
     * Specify the number to be displayed as             your phone number when you call
     */
    callerid?: string;
    active?: boolean;
};

