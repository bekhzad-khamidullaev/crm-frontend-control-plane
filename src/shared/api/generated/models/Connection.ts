/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConnectionTypeEnum } from './ConnectionTypeEnum';
import type { ProviderEnum } from './ProviderEnum';
export type Connection = {
    readonly id: number;
    /**
     * Specify VoIP service provider
     *
     * * `Zadarma` - Zadarma
     * * `OnlinePBX` - OnlinePBX
     * * `Asterisk` - Asterisk
     */
    provider: ProviderEnum;
    type?: ConnectionTypeEnum;
    number: string;
    owner?: number | null;
    readonly owner_name: string;
    /**
     * Specify the number to be displayed as             your phone number when you call
     */
    callerid: string;
    active?: boolean;
};

