/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedTaskStageList } from '../models/PaginatedTaskStageList';
import type { TaskStage } from '../models/TaskStage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TaskStagesService {
    /**
     * Reference list of task stages.
     * @returns PaginatedTaskStageList
     * @throws ApiError
     */
    public static taskStagesList({
        ordering,
        page,
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
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedTaskStageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/task-stages/',
            query: {
                'ordering': ordering,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * Reference list of task stages.
     * @returns TaskStage
     * @throws ApiError
     */
    public static taskStagesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Task stage.
         */
        id: number,
    }): CancelablePromise<TaskStage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/task-stages/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
