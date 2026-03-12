/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CallLogDirectionEnum } from './CallLogDirectionEnum';
export type CallLog = {
    readonly id: number;
    direction: CallLogDirectionEnum;
    number: string;
    /**
     * Duration in seconds
     */
    duration?: number;
    readonly timestamp: string;
    /**
     * ID from VoIP provider
     */
    voip_call_id?: string | null;
    readonly user: number;
    contact?: number | null;
};

