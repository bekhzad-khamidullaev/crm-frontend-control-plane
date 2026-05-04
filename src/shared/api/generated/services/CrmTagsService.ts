/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CrmTag } from '../models/CrmTag';
import type { PaginatedCrmTagList } from '../models/PaginatedCrmTagList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CrmTagsService {
    /**
     * Reference list of CRM tags.
     * @returns PaginatedCrmTagList
     * @throws ApiError
     */
    public static crmTagsList({
        department,
        ordering,
        owner,
        page,
        pageSize,
        search,
    }: {
        department?: number,
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
    }): CancelablePromise<PaginatedCrmTagList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crm-tags/',
            query: {
                'department': department,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Reference list of CRM tags.
     * @returns CrmTag
     * @throws ApiError
     */
    public static crmTagsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Tag.
         */
        id: number,
    }): CancelablePromise<CrmTag> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crm-tags/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
