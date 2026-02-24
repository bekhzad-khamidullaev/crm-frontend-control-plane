/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Lead } from '../models/Lead';
import type { PaginatedLeadList } from '../models/PaginatedLeadList';
import type { PatchedLead } from '../models/PatchedLead';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LeadsService {
    /**
     * CRUD for CRM leads with filtering and conversion actions.
     * @returns PaginatedLeadList
     * @throws ApiError
     */
    public static leadsList({
        company,
        country,
        department,
        disqualified,
        leadSource,
        ordering,
        owner,
        page,
        search,
        wasInTouch,
    }: {
        company?: number,
        country?: number,
        department?: number,
        disqualified?: boolean,
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
         * A search term.
         */
        search?: string,
        wasInTouch?: string,
    }): CancelablePromise<PaginatedLeadList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/leads/',
            query: {
                'company': company,
                'country': country,
                'department': department,
                'disqualified': disqualified,
                'lead_source': leadSource,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'search': search,
                'was_in_touch': wasInTouch,
            },
        });
    }
    /**
     * CRUD for CRM leads with filtering and conversion actions.
     * @returns Lead
     * @throws ApiError
     */
    public static leadsCreate({
        requestBody,
    }: {
        requestBody: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/leads/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for CRM leads with filtering and conversion actions.
     * @returns Lead
     * @throws ApiError
     */
    public static leadsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/leads/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for CRM leads with filtering and conversion actions.
     * @returns Lead
     * @throws ApiError
     */
    public static leadsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
        requestBody: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/leads/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for CRM leads with filtering and conversion actions.
     * @returns Lead
     * @throws ApiError
     */
    public static leadsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
        requestBody?: PatchedLead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/leads/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for CRM leads with filtering and conversion actions.
     * @returns void
     * @throws ApiError
     */
    public static leadsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/leads/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for CRM leads with filtering and conversion actions.
     * @returns Lead
     * @throws ApiError
     */
    public static leadsassignCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
        requestBody: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/leads/{id}/assign/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for CRM leads with filtering and conversion actions.
     * @returns Lead
     * @throws ApiError
     */
    public static leadsconvertCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
        requestBody: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/leads/{id}/convert/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for CRM leads with filtering and conversion actions.
     * @returns Lead
     * @throws ApiError
     */
    public static leadsdisqualifyCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
        requestBody: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/leads/{id}/disqualify/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for CRM leads with filtering and conversion actions.
     * @returns Lead
     * @throws ApiError
     */
    public static leadsbulkTagCreate({
        requestBody,
    }: {
        requestBody: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/leads/bulk_tag/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
