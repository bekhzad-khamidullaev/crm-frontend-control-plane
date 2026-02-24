/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InstagramAccount } from '../models/InstagramAccount';
import type { InstagramAccountCreate } from '../models/InstagramAccountCreate';
import type { PaginatedInstagramAccountList } from '../models/PaginatedInstagramAccountList';
import type { PatchedInstagramAccount } from '../models/PatchedInstagramAccount';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsinstagramaccountsService {
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns PaginatedInstagramAccountList
     * @throws ApiError
     */
    public static settingsinstagramaccountsList({
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
    }): CancelablePromise<PaginatedInstagramAccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/instagram/accounts/',
            query: {
                'ordering': ordering,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns InstagramAccountCreate
     * @throws ApiError
     */
    public static settingsinstagramaccountsCreate({
        requestBody,
    }: {
        requestBody: InstagramAccountCreate,
    }): CancelablePromise<InstagramAccountCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/instagram/accounts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsinstagramaccountsRetrieve({
        id,
    }: {
        id: string,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/instagram/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsinstagramaccountsUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: InstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/settings/instagram/accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsinstagramaccountsPartialUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: PatchedInstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/instagram/accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns void
     * @throws ApiError
     */
    public static settingsinstagramaccountsDestroy({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/settings/instagram/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
