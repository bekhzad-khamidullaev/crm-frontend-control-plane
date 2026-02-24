/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedShipmentList } from '../models/PaginatedShipmentList';
import type { PatchedShipment } from '../models/PatchedShipment';
import type { Shipment } from '../models/Shipment';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ShipmentsService {
    /**
     * CRUD API for shipments (shipped outputs only)
     * @returns PaginatedShipmentList
     * @throws ApiError
     */
    public static shipmentsList({
        currency,
        deal,
        ordering,
        page,
        product,
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
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedShipmentList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/shipments/',
            query: {
                'currency': currency,
                'deal': deal,
                'ordering': ordering,
                'page': page,
                'product': product,
                'search': search,
            },
        });
    }
    /**
     * CRUD API for shipments (shipped outputs only)
     * @returns Shipment
     * @throws ApiError
     */
    public static shipmentsCreate({
        requestBody,
    }: {
        requestBody: Shipment,
    }): CancelablePromise<Shipment> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/shipments/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for shipments (shipped outputs only)
     * @returns Shipment
     * @throws ApiError
     */
    public static shipmentsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Shipment.
         */
        id: number,
    }): CancelablePromise<Shipment> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/shipments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD API for shipments (shipped outputs only)
     * @returns Shipment
     * @throws ApiError
     */
    public static shipmentsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Shipment.
         */
        id: number,
        requestBody: Shipment,
    }): CancelablePromise<Shipment> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/shipments/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for shipments (shipped outputs only)
     * @returns Shipment
     * @throws ApiError
     */
    public static shipmentsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Shipment.
         */
        id: number,
        requestBody?: PatchedShipment,
    }): CancelablePromise<Shipment> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/shipments/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for shipments (shipped outputs only)
     * @returns void
     * @throws ApiError
     */
    public static shipmentsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Shipment.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/shipments/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
