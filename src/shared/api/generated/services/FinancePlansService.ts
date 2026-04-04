/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FinancePlan } from '../models/FinancePlan';
import type { PaginatedFinancePlanList } from '../models/PaginatedFinancePlanList';
import type { PatchedFinancePlan } from '../models/PatchedFinancePlan';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FinancePlansService {
    /**
     * CRUD API for finance planning records.
     * @returns PaginatedFinancePlanList
     * @throws ApiError
     */
    public static financePlansList({
        currency,
        ordering,
        owner,
        page,
        pageSize,
        search,
        status,
    }: {
        currency?: number,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        owner?: number,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
        /**
         * * `draft` - Draft
         * * `approved` - Approved
         * * `closed` - Closed
         */
        status?: 'approved' | 'closed' | 'draft',
    }): CancelablePromise<PaginatedFinancePlanList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/finance-plans/',
            query: {
                'currency': currency,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'status': status,
            },
        });
    }
    /**
     * CRUD API for finance planning records.
     * @returns FinancePlan
     * @throws ApiError
     */
    public static financePlansCreate({
        requestBody,
    }: {
        requestBody: FinancePlan,
    }): CancelablePromise<FinancePlan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/finance-plans/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for finance planning records.
     * @returns FinancePlan
     * @throws ApiError
     */
    public static financePlansRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Finance plan.
         */
        id: number,
    }): CancelablePromise<FinancePlan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/finance-plans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD API for finance planning records.
     * @returns FinancePlan
     * @throws ApiError
     */
    public static financePlansUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Finance plan.
         */
        id: number,
        requestBody: FinancePlan,
    }): CancelablePromise<FinancePlan> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/finance-plans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for finance planning records.
     * @returns FinancePlan
     * @throws ApiError
     */
    public static financePlansPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Finance plan.
         */
        id: number,
        requestBody?: PatchedFinancePlan,
    }): CancelablePromise<FinancePlan> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/finance-plans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for finance planning records.
     * @returns void
     * @throws ApiError
     */
    public static financePlansDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Finance plan.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/finance-plans/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
