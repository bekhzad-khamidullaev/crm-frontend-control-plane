/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FacebookPage } from '../models/FacebookPage';
import type { FacebookPageCreate } from '../models/FacebookPageCreate';
import type { PaginatedFacebookPageList } from '../models/PaginatedFacebookPageList';
import type { PatchedFacebookPage } from '../models/PatchedFacebookPage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsfacebookpagesService {
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns PaginatedFacebookPageList
     * @throws ApiError
     */
    public static settingsfacebookpagesList({
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
    }): CancelablePromise<PaginatedFacebookPageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/facebook/pages/',
            query: {
                'ordering': ordering,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns FacebookPageCreate
     * @throws ApiError
     */
    public static settingsfacebookpagesCreate({
        requestBody,
    }: {
        requestBody: FacebookPageCreate,
    }): CancelablePromise<FacebookPageCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/facebook/pages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsfacebookpagesRetrieve({
        id,
    }: {
        id: string,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/facebook/pages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsfacebookpagesUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: FacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/settings/facebook/pages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsfacebookpagesPartialUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: PatchedFacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/facebook/pages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns void
     * @throws ApiError
     */
    public static settingsfacebookpagesDestroy({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/settings/facebook/pages/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
