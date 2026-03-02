/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardActivityItem } from '../models/DashboardActivityItem';
import type { DashboardAnalyticsResponse } from '../models/DashboardAnalyticsResponse';
import type { DashboardFunnelItem } from '../models/DashboardFunnelItem';
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
}
