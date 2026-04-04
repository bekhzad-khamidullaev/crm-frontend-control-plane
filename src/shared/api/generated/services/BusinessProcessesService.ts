/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedProcessInstanceListList } from '../models/PaginatedProcessInstanceListList';
import type { PaginatedProcessTemplateListList } from '../models/PaginatedProcessTemplateListList';
import type { PatchedProcessTemplateUpsert } from '../models/PatchedProcessTemplateUpsert';
import type { ProcessInstanceDetail } from '../models/ProcessInstanceDetail';
import type { ProcessTemplateDetail } from '../models/ProcessTemplateDetail';
import type { ProcessTemplateUpsert } from '../models/ProcessTemplateUpsert';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BusinessProcessesService {
    /**
     * @returns PaginatedProcessInstanceListList
     * @throws ApiError
     */
    public static businessProcessesInstancesList({
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
    }): CancelablePromise<PaginatedProcessInstanceListList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/business-processes/instances/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns ProcessInstanceDetail
     * @throws ApiError
     */
    public static businessProcessesInstancesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this process instance.
         */
        id: number,
    }): CancelablePromise<ProcessInstanceDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/business-processes/instances/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ProcessInstanceDetail
     * @throws ApiError
     */
    public static businessProcessesInstancesAdvanceCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this process instance.
         */
        id: number,
        requestBody: ProcessInstanceDetail,
    }): CancelablePromise<ProcessInstanceDetail> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/business-processes/instances/{id}/advance/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ProcessInstanceDetail
     * @throws ApiError
     */
    public static businessProcessesInstancesCancelCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this process instance.
         */
        id: number,
        requestBody: ProcessInstanceDetail,
    }): CancelablePromise<ProcessInstanceDetail> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/business-processes/instances/{id}/cancel/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedProcessTemplateListList
     * @throws ApiError
     */
    public static businessProcessesTemplatesList({
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
    }): CancelablePromise<PaginatedProcessTemplateListList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/business-processes/templates/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns ProcessTemplateUpsert
     * @throws ApiError
     */
    public static businessProcessesTemplatesCreate({
        requestBody,
    }: {
        requestBody: ProcessTemplateUpsert,
    }): CancelablePromise<ProcessTemplateUpsert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/business-processes/templates/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ProcessTemplateDetail
     * @throws ApiError
     */
    public static businessProcessesTemplatesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this process template.
         */
        id: number,
    }): CancelablePromise<ProcessTemplateDetail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/business-processes/templates/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ProcessTemplateUpsert
     * @throws ApiError
     */
    public static businessProcessesTemplatesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this process template.
         */
        id: number,
        requestBody: ProcessTemplateUpsert,
    }): CancelablePromise<ProcessTemplateUpsert> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/business-processes/templates/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ProcessTemplateUpsert
     * @throws ApiError
     */
    public static businessProcessesTemplatesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this process template.
         */
        id: number,
        requestBody?: PatchedProcessTemplateUpsert,
    }): CancelablePromise<ProcessTemplateUpsert> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/business-processes/templates/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ProcessTemplateDetail
     * @throws ApiError
     */
    public static businessProcessesTemplatesLaunchCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this process template.
         */
        id: number,
        requestBody: ProcessTemplateDetail,
    }): CancelablePromise<ProcessTemplateDetail> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/business-processes/templates/{id}/launch/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
