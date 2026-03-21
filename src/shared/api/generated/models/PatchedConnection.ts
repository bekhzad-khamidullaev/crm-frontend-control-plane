/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConnectionProviderEnum } from './ConnectionProviderEnum';
import type { ConnectionTypeEnum } from './ConnectionTypeEnum';
export type PatchedConnection = {
    readonly id?: number;
    /**
     * Specify VoIP service provider
     *
     * * `Asterisk` - Asterisk
     */
    provider?: ConnectionProviderEnum;
    type?: ConnectionTypeEnum;
    number?: string;
    owner?: number | null;
    readonly owner_name?: string;
    /**
     * Specify the number to be displayed as             your phone number when you call
     */
    callerid?: string;
    active?: boolean;
};
