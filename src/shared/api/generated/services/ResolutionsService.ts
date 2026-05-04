/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedResolutionList } from '../models/PaginatedResolutionList';
import type { Resolution } from '../models/Resolution';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ResolutionsService {
    /**
     * Reference list of memo resolutions.
     * @returns PaginatedResolutionList
     * @throws ApiError
     */
    public static resolutionsList({
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
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
    }): CancelablePromise<PaginatedResolutionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/resolutions/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Reference list of memo resolutions.
     * @returns Resolution
     * @throws ApiError
     */
    public static resolutionsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Resolution.
         */
        id: number,
    }): CancelablePromise<Resolution> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/resolutions/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
