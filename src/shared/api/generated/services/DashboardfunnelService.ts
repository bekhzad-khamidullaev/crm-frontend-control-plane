/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardfunnelService {
    /**
     * Returns sales funnel data as a list of {label, value} by deal stage.
     * Supports filters: period(7d|30d|90d), owner, department.
     * RBAC: non-staff users see only owned/co-owned deals.
     * @returns any No response body
     * @throws ApiError
     */
    public static dashboardfunnelRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/dashboard/funnel/',
        });
    }
}
