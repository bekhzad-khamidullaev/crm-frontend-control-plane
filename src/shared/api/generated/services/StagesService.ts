/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedStageList } from '../models/PaginatedStageList';
import type { Stage } from '../models/Stage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StagesService {
    /**
     * Reference list of CRM deal stages.
     * @returns PaginatedStageList
     * @throws ApiError
     */
    public static stagesList({
        conditionalSuccessStage,
        _default,
        department,
        ordering,
        page,
        search,
        secondDefault,
        successStage,
    }: {
        conditionalSuccessStage?: boolean,
        _default?: boolean,
        department?: number,
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
        secondDefault?: boolean,
        successStage?: boolean,
    }): CancelablePromise<PaginatedStageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stages/',
            query: {
                'conditional_success_stage': conditionalSuccessStage,
                'default': _default,
                'department': department,
                'ordering': ordering,
                'page': page,
                'search': search,
                'second_default': secondDefault,
                'success_stage': successStage,
            },
        });
    }
    /**
     * Reference list of CRM deal stages.
     * @returns Stage
     * @throws ApiError
     */
    public static stagesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Stage.
         */
        id: number,
    }): CancelablePromise<Stage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/stages/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
