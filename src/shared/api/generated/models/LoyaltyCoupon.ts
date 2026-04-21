/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoyaltyCouponStatusEnum } from './LoyaltyCouponStatusEnum';
export type LoyaltyCoupon = {
    readonly id: number;
    offer: number;
    readonly offer_title: string;
    account: number;
    code: string;
    status?: LoyaltyCouponStatusEnum;
    readonly issued_at: string;
    redeemed_at?: string | null;
    expires_at?: string | null;
};

