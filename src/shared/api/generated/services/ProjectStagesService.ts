/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedProjectStageList } from '../models/PaginatedProjectStageList';
import type { ProjectStage } from '../models/ProjectStage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProjectStagesService {
    /**
     * Reference list of project stages.
     * @returns PaginatedProjectStageList
     * @throws ApiError
     */
    public static projectStagesList({
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
    }): CancelablePromise<PaginatedProjectStageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/project-stages/',
            query: {
                'ordering': ordering,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * Reference list of project stages.
     * @returns ProjectStage
     * @throws ApiError
     */
    public static projectStagesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Project stage.
         */
        id: number,
    }): CancelablePromise<ProjectStage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/project-stages/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
