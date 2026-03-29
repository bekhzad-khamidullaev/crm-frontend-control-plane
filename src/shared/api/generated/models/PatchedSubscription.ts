/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubscriptionStatusEnum } from './SubscriptionStatusEnum';
export type PatchedSubscription = {
    readonly id?: number;
    customer?: number;
    readonly customer_code?: string;
    readonly customer_name?: string;
    plan?: number;
    readonly plan_code?: string;
    readonly plan_name?: string;
    readonly plan_edition_code?: string;
    readonly plan_install_profile_code?: string;
    bundle?: number | null;
    readonly bundle_code?: string;
    readonly bundle_name?: string;
    readonly bundle_owner_username?: string;
    readonly bundle_support_owner_username?: string;
    status?: SubscriptionStatusEnum;
    valid_from?: string;
    valid_to?: string;
    max_active_users?: number;
    extra_features?: Array<number>;
    readonly extra_feature_codes?: Array<string>;
};

