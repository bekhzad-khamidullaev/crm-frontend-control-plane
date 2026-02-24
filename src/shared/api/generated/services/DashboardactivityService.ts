/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardactivityService {
    /**
     * Provides a real-time activity feed showing recent changes across the CRM.
     * Returns a list of activities sorted by timestamp.
     * @returns any No response body
     * @throws ApiError
     */
    public static dashboardactivityRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/dashboard/activity/',
        });
    }
}
