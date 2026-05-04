/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Department } from '../models/Department';
import type { LandingCrmDictionaries } from '../models/LandingCrmDictionaries';
import type { LandingPage } from '../models/LandingPage';
import type { LeadSource } from '../models/LeadSource';
import type { PaginatedLandingPageListList } from '../models/PaginatedLandingPageListList';
import type { PatchedLandingPage } from '../models/PatchedLandingPage';
import type { Stage } from '../models/Stage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LandingBuilderService {
    /**
     * @returns Department
     * @throws ApiError
     */
    public static commonDepartmentsList(): CancelablePromise<Array<Department>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/common/departments/',
        });
    }
    /**
     * @returns LeadSource
     * @throws ApiError
     */
    public static crmLeadSourcesList(): CancelablePromise<Array<LeadSource>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crm/lead-sources/',
        });
    }
    /**
     * @returns LandingCrmDictionaries
     * @throws ApiError
     */
    public static crmLookupsRetrieve(): CancelablePromise<LandingCrmDictionaries> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crm/lookups/',
        });
    }
    /**
     * @returns Stage
     * @throws ApiError
     */
    public static crmStagesList(): CancelablePromise<Array<Stage>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crm/stages/',
        });
    }
    /**
     * @returns PaginatedLandingPageListList
     * @throws ApiError
     */
    public static landingsList({
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
    }): CancelablePromise<PaginatedLandingPageListList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/landings/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsCreate({
        requestBody,
    }: {
        requestBody: LandingPage,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/landings/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/landings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
        requestBody: LandingPage,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/landings/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
        requestBody?: PatchedLandingPage,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/landings/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static landingsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/landings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsAssetsUploadCreate({
        id,
        formData,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
        formData: LandingPage,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/landings/{id}/assets/upload/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsBindingsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/landings/{id}/bindings/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsBindingsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
        requestBody: LandingPage,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/landings/{id}/bindings/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsDraftRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/landings/{id}/draft/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsDraftUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
        requestBody: LandingPage,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/landings/{id}/draft/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsPreviewTokenRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/landings/{id}/preview_token/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsPublishCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
        requestBody: LandingPage,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/landings/{id}/publish/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsReportRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/landings/{id}/report/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsRevisionsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/landings/{id}/revisions/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LandingPage
     * @throws ApiError
     */
    public static landingsRollbackCreate({
        id,
        revisionId,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this landing page.
         */
        id: number,
        revisionId: string,
        requestBody: LandingPage,
    }): CancelablePromise<LandingPage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/landings/{id}/rollback/{revision_id}/',
            path: {
                'id': id,
                'revision_id': revisionId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
