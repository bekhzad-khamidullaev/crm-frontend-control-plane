/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DirectionEnum } from './DirectionEnum';
export type PatchedCallLog = {
    readonly id?: number;
    direction?: DirectionEnum;
    number?: string;
    /**
     * Duration in seconds
     */
    duration?: number;
    readonly timestamp?: string;
    /**
     * ID from VoIP provider
     */
    voip_call_id?: string | null;
    readonly user?: number;
    contact?: number | null;
};

