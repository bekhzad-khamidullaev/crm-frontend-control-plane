/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LoyaltyProgram = {
    readonly id: number;
    code: string;
    name: string;
    description?: string;
    is_active?: boolean;
    accrual_points_per_currency?: string;
    redemption_value_per_point?: string;
    welcome_bonus_points?: number;
    realtime_channel?: string;
};

