/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedWarehouseItemList } from '../models/PaginatedWarehouseItemList';
import type { PatchedWarehouseItem } from '../models/PatchedWarehouseItem';
import type { WarehouseItem } from '../models/WarehouseItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class WarehouseService {
    /**
     * CRUD API for warehouse items.
     * @returns PaginatedWarehouseItemList
     * @throws ApiError
     */
    public static warehouseItemsList({
        category,
        location,
        ordering,
        owner,
        page,
        pageSize,
        search,
        status,
    }: {
        category?: string,
        location?: string,
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
         * * `active` - Active
         * * `archived` - Archived
         */
        status?: 'active' | 'archived',
    }): CancelablePromise<PaginatedWarehouseItemList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/warehouse-items/',
            query: {
                'category': category,
                'location': location,
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
     * CRUD API for warehouse items.
     * @returns WarehouseItem
     * @throws ApiError
     */
    public static warehouseItemsCreate({
        requestBody,
    }: {
        requestBody: WarehouseItem,
    }): CancelablePromise<WarehouseItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/warehouse-items/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for warehouse items.
     * @returns WarehouseItem
     * @throws ApiError
     */
    public static warehouseItemsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Warehouse item.
         */
        id: number,
    }): CancelablePromise<WarehouseItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/warehouse-items/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD API for warehouse items.
     * @returns WarehouseItem
     * @throws ApiError
     */
    public static warehouseItemsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Warehouse item.
         */
        id: number,
        requestBody: WarehouseItem,
    }): CancelablePromise<WarehouseItem> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/warehouse-items/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for warehouse items.
     * @returns WarehouseItem
     * @throws ApiError
     */
    public static warehouseItemsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Warehouse item.
         */
        id: number,
        requestBody?: PatchedWarehouseItem,
    }): CancelablePromise<WarehouseItem> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/warehouse-items/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for warehouse items.
     * @returns void
     * @throws ApiError
     */
    public static warehouseItemsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Warehouse item.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/warehouse-items/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
