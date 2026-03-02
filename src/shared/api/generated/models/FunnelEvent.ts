/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventTypeEnum } from './EventTypeEnum';
export type FunnelEvent = {
    readonly id: number;
    landing?: number | null;
    landing_slug?: string;
    lead?: number | null;
    deal?: number | null;
    session_id?: string;
    event_type: EventTypeEnum;
    block_id?: string;
    form_key?: string;
    meta?: any;
    readonly created_at: string;
};

