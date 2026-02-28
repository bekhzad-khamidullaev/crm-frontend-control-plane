/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Company } from '../models/Company';
import type { PaginatedCompanyList } from '../models/PaginatedCompanyList';
import type { PatchedCompany } from '../models/PatchedCompany';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CompaniesService {
    /**
     * CRUD for companies with search and filters.
     * @returns PaginatedCompanyList
     * @throws ApiError
     */
    public static companiesList({
        country,
        department,
        disqualified,
        leadSource,
        ordering,
        owner,
        page,
        search,
        type,
    }: {
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
        type?: number,
    }): CancelablePromise<PaginatedCompanyList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/companies/',
            query: {
                'country': country,
                'department': department,
                'disqualified': disqualified,
                'lead_source': leadSource,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'search': search,
                'type': type,
            },
        });
    }
    /**
     * CRUD for companies with search and filters.
     * @returns Company
     * @throws ApiError
     */
    public static companiesCreate({
        requestBody,
    }: {
        requestBody: Company,
    }): CancelablePromise<Company> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/companies/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for companies with search and filters.
     * @returns Company
     * @throws ApiError
     */
    public static companiesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Company.
         */
        id: number,
    }): CancelablePromise<Company> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/companies/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for companies with search and filters.
     * @returns Company
     * @throws ApiError
     */
    public static companiesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Company.
         */
        id: number,
        requestBody: Company,
    }): CancelablePromise<Company> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/companies/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for companies with search and filters.
     * @returns Company
     * @throws ApiError
     */
    public static companiesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Company.
         */
        id: number,
        requestBody?: PatchedCompany,
    }): CancelablePromise<Company> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/companies/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for companies with search and filters.
     * @returns void
     * @throws ApiError
     */
    public static companiesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Company.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/companies/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
