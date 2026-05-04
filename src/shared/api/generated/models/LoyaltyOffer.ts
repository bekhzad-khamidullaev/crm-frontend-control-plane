/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoyaltyOfferStatusEnum } from './LoyaltyOfferStatusEnum';
import type { OfferTypeEnum } from './OfferTypeEnum';
export type LoyaltyOffer = {
    readonly id: number;
    program: number;
    readonly program_name: string;
    title: string;
    description?: string;
    offer_type?: OfferTypeEnum;
    status?: LoyaltyOfferStatusEnum;
    priority?: number;
    points_cost?: number;
    discount_percent?: string;
    segment_code?: string;
    starts_at?: string | null;
    ends_at?: string | null;
};

