/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LicenseOperationsAlert } from './LicenseOperationsAlert';
import type { LicenseOperationsCodeStat } from './LicenseOperationsCodeStat';
import type { LicenseOperationsEndpointStat } from './LicenseOperationsEndpointStat';
import type { LicenseOperationsFeatureStat } from './LicenseOperationsFeatureStat';
import type { LicenseOperationsRuntimeSurfaceStat } from './LicenseOperationsRuntimeSurfaceStat';
import type { LicenseOperationsSurfaceStat } from './LicenseOperationsSurfaceStat';
import type { LicenseOperationsTotals } from './LicenseOperationsTotals';
import type { LicenseOperationsTrendBucket } from './LicenseOperationsTrendBucket';
export type LicenseOperationsSummary = {
    source: string;
    window_hours: number;
    generated_at: string;
    totals: LicenseOperationsTotals;
    by_code: Array<LicenseOperationsCodeStat>;
    by_feature: Array<LicenseOperationsFeatureStat>;
    by_endpoint: Array<LicenseOperationsEndpointStat>;
    by_surface: Array<LicenseOperationsSurfaceStat>;
    by_runtime_surface: Array<LicenseOperationsRuntimeSurfaceStat>;
    trend: Array<LicenseOperationsTrendBucket>;
    alerts: Array<LicenseOperationsAlert>;
};

