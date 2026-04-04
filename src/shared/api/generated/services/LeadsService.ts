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
        pageSize,
        search,
        status,
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
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
        /**
         * * `new` - New
         * * `contacted` - Contacted
         * * `qualified` - Qualified
         * * `converted` - Converted
         * * `lost` - Lost
         */
        status?: 'contacted' | 'converted' | 'lost' | 'new' | 'qualified',
        wasInTouch?: string,
    }): CancelablePromise<PaginatedLeadList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/leads/',
            query: {
                'company': company,
                'country': country,
                'department': department,
                'disqualified': disqualified,
                'lead_source': leadSource,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'status': status,
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
        requestBody?: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/leads/',
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
            url: '/api/leads/{id}/',
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
        requestBody?: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/leads/{id}/',
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
            url: '/api/leads/{id}/',
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
            url: '/api/leads/{id}/',
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
    public static leadsAssignCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
        requestBody?: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/leads/{id}/assign/',
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
    public static leadsConvertCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
        requestBody?: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/leads/{id}/convert/',
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
    public static leadsDisqualifyCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
        requestBody?: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/leads/{id}/disqualify/',
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
    public static leadsInsightsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Lead.
         */
        id: number,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/leads/{id}/insights/',
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
    public static leadsBulkTagCreate({
        requestBody,
    }: {
        requestBody?: Lead,
    }): CancelablePromise<Lead> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/leads/bulk_tag/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
