/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoyaltyAccountStatusEnum } from './LoyaltyAccountStatusEnum';
export type LoyaltyAccount = {
    readonly id: number;
    program: number;
    readonly program_name: string;
    contact: number;
    readonly contact_name: string;
    company?: number | null;
    readonly company_name: string;
    current_tier?: number | null;
    readonly tier_name: string;
    readonly tier_color: string;
    status?: LoyaltyAccountStatusEnum;
    points_balance?: number;
    lifetime_points?: number;
    last_activity_at?: string | null;
    consent_scope?: string;
    external_customer_id?: string;
    creation_date?: string;
    readonly update_date: string;
};

