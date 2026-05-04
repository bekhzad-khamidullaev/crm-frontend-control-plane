/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PublicFunnelEventTypeEnum } from './PublicFunnelEventTypeEnum';
export type PublicFunnelEventCreate = {
    session_id?: string;
    landing_slug: string;
    event_type: PublicFunnelEventTypeEnum;
    block_id?: string;
    form_key?: string;
    meta?: any;
};

