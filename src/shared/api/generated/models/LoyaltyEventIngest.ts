/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoyaltyEventIngestEventTypeEnum } from './LoyaltyEventIngestEventTypeEnum';
export type LoyaltyEventIngest = {
    contact?: number | null;
    deal?: number | null;
    program_code?: string;
    event_type: LoyaltyEventIngestEventTypeEnum;
    amount?: string | null;
    points?: number | null;
    idempotency_key?: string;
    external_event_id?: string;
    description?: string;
    payload?: any;
};

