/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CrmEmail } from '../models/CrmEmail';
import type { PaginatedCrmEmailList } from '../models/PaginatedCrmEmailList';
import type { PatchedCrmEmail } from '../models/PatchedCrmEmail';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CrmEmailsService {
    /**
     * CRUD API for CRM emails
     * @returns PaginatedCrmEmailList
     * @throws ApiError
     */
    public static crmEmailsList({
        company,
        contact,
        deal,
        incoming,
        lead,
        ordering,
        owner,
        page,
        request,
        search,
    }: {
        company?: number,
        contact?: number,
        deal?: number,
        incoming?: boolean,
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
        request?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedCrmEmailList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crm-emails/',
            query: {
                'company': company,
                'contact': contact,
                'deal': deal,
                'incoming': incoming,
                'lead': lead,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'request': request,
                'search': search,
            },
        });
    }
    /**
     * CRUD API for CRM emails
     * @returns CrmEmail
     * @throws ApiError
     */
    public static crmEmailsCreate({
        requestBody,
    }: {
        requestBody: CrmEmail,
    }): CancelablePromise<CrmEmail> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/crm-emails/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for CRM emails
     * @returns CrmEmail
     * @throws ApiError
     */
    public static crmEmailsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Email.
         */
        id: number,
    }): CancelablePromise<CrmEmail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/crm-emails/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD API for CRM emails
     * @returns CrmEmail
     * @throws ApiError
     */
    public static crmEmailsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Email.
         */
        id: number,
        requestBody: CrmEmail,
    }): CancelablePromise<CrmEmail> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/crm-emails/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for CRM emails
     * @returns CrmEmail
     * @throws ApiError
     */
    public static crmEmailsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Email.
         */
        id: number,
        requestBody?: PatchedCrmEmail,
    }): CancelablePromise<CrmEmail> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/crm-emails/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for CRM emails
     * @returns void
     * @throws ApiError
     */
    public static crmEmailsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Email.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/crm-emails/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
