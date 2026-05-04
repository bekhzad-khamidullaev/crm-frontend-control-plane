/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AnalyticsService {
    /**
     * BI metrics by lead acquisition channels.
     * @returns any
     * @throws ApiError
     */
    public static analyticsLeadChannelsRetrieve(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/lead-channels/',
        });
    }
    /**
     * BI metrics for marketing campaigns with delivery and funnel attribution.
     * @returns any
     * @throws ApiError
     */
    public static analyticsMarketingCampaignsRetrieve(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/marketing-campaigns/',
        });
    }
    /**
     * Get overview analytics for dashboard
     * @returns any
     * @throws ApiError
     */
    public static analyticsOverviewRetrieve(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/analytics/overview/',
        });
    }
}
