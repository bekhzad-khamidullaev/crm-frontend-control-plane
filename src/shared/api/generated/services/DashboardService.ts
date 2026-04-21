/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardActivityItem } from '../models/DashboardActivityItem';
import type { DashboardAnalyticsResponse } from '../models/DashboardAnalyticsResponse';
import type { DashboardChannelsV2Response } from '../models/DashboardChannelsV2Response';
import type { DashboardFilterOptionsV2Response } from '../models/DashboardFilterOptionsV2Response';
import type { DashboardFunnelItem } from '../models/DashboardFunnelItem';
import type { DashboardOverviewV2Response } from '../models/DashboardOverviewV2Response';
import type { DashboardPreferencesV2Request } from '../models/DashboardPreferencesV2Request';
import type { DashboardPreferencesV2Response } from '../models/DashboardPreferencesV2Response';
import type { DashboardSalesPerformanceV2Response } from '../models/DashboardSalesPerformanceV2Response';
import type { DashboardTeamActivityV2Response } from '../models/DashboardTeamActivityV2Response';
import type { DashboardWorkQueueV2Response } from '../models/DashboardWorkQueueV2Response';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * Returns recent activity feed. Supports filters: owner, department, limit.
     * @returns DashboardActivityItem
     * @throws ApiError
     */
    public static dashboardActivityList({
        department,
        limit,
        owner,
    }: {
        /**
         * Filter by department id
         */
        department?: number,
        /**
         * Max items to return
         */
        limit?: number,
        /**
         * Filter by owner id
         */
        owner?: number,
    }): CancelablePromise<Array<DashboardActivityItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/activity/',
            query: {
                'department': department,
                'limit': limit,
                'owner': owner,
            },
        });
    }
    /**
     * Returns KPI metrics for dashboard. Filters: period(7d|30d|90d), owner, department.
     * @returns DashboardAnalyticsResponse
     * @throws ApiError
     */
    public static dashboardAnalyticsRetrieve({
        department,
        owner,
        period,
    }: {
        /**
         * Filter by department id
         */
        department?: number,
        /**
         * Filter by owner id
         */
        owner?: number,
        /**
         * Time window
         */
        period?: string,
    }): CancelablePromise<DashboardAnalyticsResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/analytics/',
            query: {
                'department': department,
                'owner': owner,
                'period': period,
            },
        });
    }
    /**
     * Returns Channels & Campaigns tab data for dashboard v2.
     * @returns DashboardChannelsV2Response
     * @throws ApiError
     */
    public static dashboardChannelsV2Retrieve(): CancelablePromise<DashboardChannelsV2Response> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/channels-v2/',
        });
    }
    /**
     * Returns authoritative filter options for dashboard v2.
     * @returns DashboardFilterOptionsV2Response
     * @throws ApiError
     */
    public static dashboardFilterOptionsV2Retrieve(): CancelablePromise<DashboardFilterOptionsV2Response> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/filter-options-v2/',
        });
    }
    /**
     * Returns sales funnel data grouped by stage. Filters: period(7d|30d|90d), owner, department.
     * @returns DashboardFunnelItem
     * @throws ApiError
     */
    public static dashboardFunnelList({
        department,
        owner,
        period,
    }: {
        /**
         * Filter by department id
         */
        department?: number,
        /**
         * Filter by owner id
         */
        owner?: number,
        /**
         * Time window
         */
        period?: string,
    }): CancelablePromise<Array<DashboardFunnelItem>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/funnel/',
            query: {
                'department': department,
                'owner': owner,
                'period': period,
            },
        });
    }
    /**
     * Returns Overview tab data for dashboard v2.
     * @returns DashboardOverviewV2Response
     * @throws ApiError
     */
    public static dashboardOverviewV2Retrieve(): CancelablePromise<DashboardOverviewV2Response> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/overview-v2/',
        });
    }
    /**
     * Returns and updates per-user BI dashboard preferences (saved views and widget layout).
     * @returns DashboardPreferencesV2Response
     * @throws ApiError
     */
    public static dashboardPreferencesV2Retrieve(): CancelablePromise<DashboardPreferencesV2Response> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/preferences-v2/',
        });
    }
    /**
     * Returns and updates per-user BI dashboard preferences (saved views and widget layout).
     * @returns DashboardPreferencesV2Response
     * @throws ApiError
     */
    public static dashboardPreferencesV2Update({
        requestBody,
    }: {
        requestBody?: DashboardPreferencesV2Request,
    }): CancelablePromise<DashboardPreferencesV2Response> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/dashboard/preferences-v2/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Returns Sales Performance tab data for dashboard v2.
     * @returns DashboardSalesPerformanceV2Response
     * @throws ApiError
     */
    public static dashboardSalesPerformanceV2Retrieve(): CancelablePromise<DashboardSalesPerformanceV2Response> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/sales-performance-v2/',
        });
    }
    /**
     * Returns Team Activity tab data for dashboard v2.
     * @returns DashboardTeamActivityV2Response
     * @throws ApiError
     */
    public static dashboardTeamActivityV2Retrieve(): CancelablePromise<DashboardTeamActivityV2Response> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/team-activity-v2/',
        });
    }
    /**
     * Returns work queue data for dashboard v2.
     * @returns DashboardWorkQueueV2Response
     * @throws ApiError
     */
    public static dashboardWorkQueueV2Retrieve(): CancelablePromise<DashboardWorkQueueV2Response> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/dashboard/work-queue-v2/',
        });
    }
}
