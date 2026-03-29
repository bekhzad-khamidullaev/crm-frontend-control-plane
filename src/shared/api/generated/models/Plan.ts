/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlankEnum } from './BlankEnum';
import type { EditionCodeEnum } from './EditionCodeEnum';
import type { InstallProfileCodeEnum } from './InstallProfileCodeEnum';
export type Plan = {
    readonly id: number;
    code: string;
    name: string;
    edition_code?: (EditionCodeEnum | BlankEnum);
    install_profile_code?: (InstallProfileCodeEnum | BlankEnum);
    base_user_limit?: number;
    platform_fee_uzs?: number;
    extra_user_fee_uzs?: number;
    typical_account_mrr_uzs?: number;
    setup_fee_min_uzs?: number | null;
    setup_fee_max_uzs?: number | null;
    implementation_days_min?: number | null;
    implementation_days_max?: number | null;
    target_segment?: string;
    value_summary?: string;
    is_active?: boolean;
    included_features?: Array<number>;
    readonly included_feature_codes: Array<string>;
};

