/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Deal } from '../models/Deal';
import type { PaginatedDealList } from '../models/PaginatedDealList';
import type { PatchedDeal } from '../models/PatchedDeal';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DealsService {
    /**
     * CRUD for CRM deals with ownership rules.
     * @returns PaginatedDealList
     * @throws ApiError
     */
    public static dealsList({
        active,
        coOwner,
        company,
        contact,
        department,
        lead,
        ordering,
        owner,
        page,
        pageSize,
        relevant,
        search,
        stage,
    }: {
        active?: boolean,
        coOwner?: number,
        company?: number,
        contact?: number,
        department?: number,
        lead?: number,
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
        relevant?: boolean,
        /**
         * A search term.
         */
        search?: string,
        stage?: number,
    }): CancelablePromise<PaginatedDealList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/deals/',
            query: {
                'active': active,
                'co_owner': coOwner,
                'company': company,
                'contact': contact,
                'department': department,
                'lead': lead,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'relevant': relevant,
                'search': search,
                'stage': stage,
            },
        });
    }
    /**
     * CRUD for CRM deals with ownership rules.
     * @returns Deal
     * @throws ApiError
     */
    public static dealsCreate({
        requestBody,
    }: {
        requestBody: Deal,
    }): CancelablePromise<Deal> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/deals/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for CRM deals with ownership rules.
     * @returns Deal
     * @throws ApiError
     */
    public static dealsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Deal.
         */
        id: number,
    }): CancelablePromise<Deal> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/deals/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for CRM deals with ownership rules.
     * @returns Deal
     * @throws ApiError
     */
    public static dealsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Deal.
         */
        id: number,
        requestBody: Deal,
    }): CancelablePromise<Deal> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/deals/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for CRM deals with ownership rules.
     * @returns Deal
     * @throws ApiError
     */
    public static dealsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Deal.
         */
        id: number,
        requestBody?: PatchedDeal,
    }): CancelablePromise<Deal> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/deals/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for CRM deals with ownership rules.
     * @returns void
     * @throws ApiError
     */
    public static dealsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Deal.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/deals/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
