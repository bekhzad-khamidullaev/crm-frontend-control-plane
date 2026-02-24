/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { APIKey } from '../models/APIKey';
import type { APIKeyCreate } from '../models/APIKeyCreate';
import type { PaginatedAPIKeyList } from '../models/PaginatedAPIKeyList';
import type { PatchedAPIKey } from '../models/PatchedAPIKey';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsapiKeysService {
    /**
     * ViewSet for API key management.
     *
     * Endpoints:
     * - GET /api/settings/api-keys/ - List all API keys
     * - POST /api/settings/api-keys/ - Create new API key
     * - GET /api/settings/api-keys/{id}/ - Get specific key
     * - DELETE /api/settings/api-keys/{id}/ - Delete key
     * - POST /api/settings/api-keys/{id}/revoke/ - Revoke key
     * - GET /api/settings/api-keys/{id}/usage/ - Get usage stats
     * @returns PaginatedAPIKeyList
     * @throws ApiError
     */
    public static settingsapiKeysList({
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
    }): CancelablePromise<PaginatedAPIKeyList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/api-keys/',
            query: {
                'ordering': ordering,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * Create a new API key with automatic key generation.
     * @returns APIKeyCreate
     * @throws ApiError
     */
    public static settingsapiKeysCreate({
        requestBody,
    }: {
        requestBody: APIKeyCreate,
    }): CancelablePromise<APIKeyCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/api-keys/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for API key management.
     *
     * Endpoints:
     * - GET /api/settings/api-keys/ - List all API keys
     * - POST /api/settings/api-keys/ - Create new API key
     * - GET /api/settings/api-keys/{id}/ - Get specific key
     * - DELETE /api/settings/api-keys/{id}/ - Delete key
     * - POST /api/settings/api-keys/{id}/revoke/ - Revoke key
     * - GET /api/settings/api-keys/{id}/usage/ - Get usage stats
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsapiKeysRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/api-keys/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for API key management.
     *
     * Endpoints:
     * - GET /api/settings/api-keys/ - List all API keys
     * - POST /api/settings/api-keys/ - Create new API key
     * - GET /api/settings/api-keys/{id}/ - Get specific key
     * - DELETE /api/settings/api-keys/{id}/ - Delete key
     * - POST /api/settings/api-keys/{id}/revoke/ - Revoke key
     * - GET /api/settings/api-keys/{id}/usage/ - Get usage stats
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsapiKeysUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
        requestBody: APIKey,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/settings/api-keys/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for API key management.
     *
     * Endpoints:
     * - GET /api/settings/api-keys/ - List all API keys
     * - POST /api/settings/api-keys/ - Create new API key
     * - GET /api/settings/api-keys/{id}/ - Get specific key
     * - DELETE /api/settings/api-keys/{id}/ - Delete key
     * - POST /api/settings/api-keys/{id}/revoke/ - Revoke key
     * - GET /api/settings/api-keys/{id}/usage/ - Get usage stats
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsapiKeysPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
        requestBody?: PatchedAPIKey,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/api-keys/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for API key management.
     *
     * Endpoints:
     * - GET /api/settings/api-keys/ - List all API keys
     * - POST /api/settings/api-keys/ - Create new API key
     * - GET /api/settings/api-keys/{id}/ - Get specific key
     * - DELETE /api/settings/api-keys/{id}/ - Delete key
     * - POST /api/settings/api-keys/{id}/revoke/ - Revoke key
     * - GET /api/settings/api-keys/{id}/usage/ - Get usage stats
     * @returns void
     * @throws ApiError
     */
    public static settingsapiKeysDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/settings/api-keys/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
