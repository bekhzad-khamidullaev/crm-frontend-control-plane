/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedTaskTagList } from '../models/PaginatedTaskTagList';
import type { TaskTag } from '../models/TaskTag';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TaskTagsService {
    /**
     * Reference list of task tags.
     * @returns PaginatedTaskTagList
     * @throws ApiError
     */
    public static taskTagsList({
        forContent,
        ordering,
        page,
        search,
    }: {
        forContent?: number,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedTaskTagList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/task-tags/',
            query: {
                'for_content': forContent,
                'ordering': ordering,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * Reference list of task tags.
     * @returns TaskTag
     * @throws ApiError
     */
    public static taskTagsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Tag.
         */
        id: number,
    }): CancelablePromise<TaskTag> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/task-tags/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
