/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedRequestList } from '../models/PaginatedRequestList';
import type { PatchedRequest } from '../models/PatchedRequest';
import type { Request } from '../models/Request';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RequestsService {
    /**
     * CRUD API for customer requests/tickets
     * @returns PaginatedRequestList
     * @throws ApiError
     */
    public static requestsList({
        company,
        contact,
        country,
        lead,
        leadSource,
        ordering,
        owner,
        page,
        pageSize,
        search,
    }: {
        company?: number,
        contact?: number,
        country?: number,
        lead?: number,
        leadSource?: number,
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
    }): CancelablePromise<PaginatedRequestList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/requests/',
            query: {
                'company': company,
                'contact': contact,
                'country': country,
                'lead': lead,
                'lead_source': leadSource,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * CRUD API for customer requests/tickets
     * @returns Request
     * @throws ApiError
     */
    public static requestsCreate({
        requestBody,
    }: {
        requestBody?: Request,
    }): CancelablePromise<Request> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for customer requests/tickets
     * @returns Request
     * @throws ApiError
     */
    public static requestsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Request.
         */
        id: number,
    }): CancelablePromise<Request> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD API for customer requests/tickets
     * @returns Request
     * @throws ApiError
     */
    public static requestsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Request.
         */
        id: number,
        requestBody?: Request,
    }): CancelablePromise<Request> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for customer requests/tickets
     * @returns Request
     * @throws ApiError
     */
    public static requestsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Request.
         */
        id: number,
        requestBody?: PatchedRequest,
    }): CancelablePromise<Request> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for customer requests/tickets
     * @returns void
     * @throws ApiError
     */
    public static requestsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Request.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
