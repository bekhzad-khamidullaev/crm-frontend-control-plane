/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * Provides a real-time activity feed showing recent changes across the CRM.
     * Returns a list of activities sorted by timestamp.
     * @returns any No response body
     * @throws ApiError
     */
    public static dashboardActivityRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/activity/',
        });
    }
    /**
     * Provides analytics data for the dashboard including monthly growth stats
     * and task metrics.
     * Supports filters: period(7d|30d|90d), owner, department.
     * @returns any No response body
     * @throws ApiError
     */
    public static dashboardAnalyticsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/analytics/',
        });
    }
    /**
     * Returns sales funnel data as a list of {label, value} by deal stage.
     * Supports filters: period(7d|30d|90d), owner, department.
     * RBAC: non-staff users see only owned/co-owned deals.
     * @returns any No response body
     * @throws ApiError
     */
    public static dashboardFunnelRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/funnel/',
        });
    }
}
