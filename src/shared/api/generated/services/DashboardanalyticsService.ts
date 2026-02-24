/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardanalyticsService {
    /**
     * Provides analytics data for the dashboard including monthly growth stats
     * and task metrics.
     * Supports filters: period(7d|30d|90d), owner, department.
     * @returns any No response body
     * @throws ApiError
     */
    public static dashboardanalyticsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/dashboard/analytics/',
        });
    }
}
