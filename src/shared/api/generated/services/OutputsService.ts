/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Output } from '../models/Output';
import type { PaginatedOutputList } from '../models/PaginatedOutputList';
import type { PatchedOutput } from '../models/PatchedOutput';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OutputsService {
    /**
     * CRUD API for product outputs/shipments
     * @returns PaginatedOutputList
     * @throws ApiError
     */
    public static outputsList({
        currency,
        deal,
        ordering,
        page,
        product,
        productIsShipped,
        search,
    }: {
        currency?: number,
        deal?: number,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        product?: number,
        productIsShipped?: boolean,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedOutputList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/outputs/',
            query: {
                'currency': currency,
                'deal': deal,
                'ordering': ordering,
                'page': page,
                'product': product,
                'product_is_shipped': productIsShipped,
                'search': search,
            },
        });
    }
    /**
     * CRUD API for product outputs/shipments
     * @returns Output
     * @throws ApiError
     */
    public static outputsCreate({
        requestBody,
    }: {
        requestBody: Output,
    }): CancelablePromise<Output> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/outputs/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for product outputs/shipments
     * @returns Output
     * @throws ApiError
     */
    public static outputsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Output.
         */
        id: number,
    }): CancelablePromise<Output> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/outputs/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD API for product outputs/shipments
     * @returns Output
     * @throws ApiError
     */
    public static outputsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Output.
         */
        id: number,
        requestBody: Output,
    }): CancelablePromise<Output> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/outputs/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for product outputs/shipments
     * @returns Output
     * @throws ApiError
     */
    public static outputsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Output.
         */
        id: number,
        requestBody?: PatchedOutput,
    }): CancelablePromise<Output> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/outputs/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for product outputs/shipments
     * @returns void
     * @throws ApiError
     */
    public static outputsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Output.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/outputs/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
