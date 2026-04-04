/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LicenseUxAutoRequest } from './LicenseUxAutoRequest';
import type { LicenseUxBlockingReason } from './LicenseUxBlockingReason';
import type { LicenseUxManualRequest } from './LicenseUxManualRequest';
import type { LicenseUxModule } from './LicenseUxModule';
import type { LicenseUxPermission } from './LicenseUxPermission';
import type { LicenseUxRecommendation } from './LicenseUxRecommendation';
import type { LicenseUxRecommendedFlow } from './LicenseUxRecommendedFlow';
import type { LicenseUxRestrictionEvent } from './LicenseUxRestrictionEvent';
import type { SeatUsage } from './SeatUsage';
export type LicenseUxSummary = {
    status: string;
    plan_code: string;
    license_id?: string | null;
    installed: boolean;
    source: string;
    seat_usage: SeatUsage;
    modules: Array<LicenseUxModule>;
    recommendations: Array<LicenseUxRecommendation>;
    recent_restrictions: Array<LicenseUxRestrictionEvent>;
    permissions: LicenseUxPermission;
    auto_request: LicenseUxAutoRequest;
    manual_request: LicenseUxManualRequest;
    recommended_flow: LicenseUxRecommendedFlow;
    blocking_reasons: Array<LicenseUxBlockingReason>;
};

