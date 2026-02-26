/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { APIKey } from '../models/APIKey';
import type { APIKeyCreate } from '../models/APIKeyCreate';
import type { FacebookPage } from '../models/FacebookPage';
import type { FacebookPageCreate } from '../models/FacebookPageCreate';
import type { InstagramAccount } from '../models/InstagramAccount';
import type { InstagramAccountCreate } from '../models/InstagramAccountCreate';
import type { IntegrationLog } from '../models/IntegrationLog';
import type { PaginatedAPIKeyList } from '../models/PaginatedAPIKeyList';
import type { PaginatedFacebookPageList } from '../models/PaginatedFacebookPageList';
import type { PaginatedInstagramAccountList } from '../models/PaginatedInstagramAccountList';
import type { PaginatedIntegrationLogList } from '../models/PaginatedIntegrationLogList';
import type { PaginatedTelegramBotList } from '../models/PaginatedTelegramBotList';
import type { PaginatedWebhookList } from '../models/PaginatedWebhookList';
import type { PatchedAPIKey } from '../models/PatchedAPIKey';
import type { PatchedFacebookPage } from '../models/PatchedFacebookPage';
import type { PatchedInstagramAccount } from '../models/PatchedInstagramAccount';
import type { PatchedTelegramBot } from '../models/PatchedTelegramBot';
import type { PatchedWebhook } from '../models/PatchedWebhook';
import type { TelegramBot } from '../models/TelegramBot';
import type { TelegramBotCreate } from '../models/TelegramBotCreate';
import type { Webhook } from '../models/Webhook';
import type { WebhookCreate } from '../models/WebhookCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsService {
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
    public static settingsApiKeysList({
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
    }): CancelablePromise<PaginatedAPIKeyList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/api-keys/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Create a new API key with automatic key generation.
     * @returns APIKeyCreate
     * @throws ApiError
     */
    public static settingsApiKeysCreate({
        requestBody,
    }: {
        requestBody: APIKeyCreate,
    }): CancelablePromise<APIKeyCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/api-keys/',
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
    public static settingsApiKeysRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/api-keys/{id}/',
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
    public static settingsApiKeysUpdate({
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
            url: '/api/settings/api-keys/{id}/',
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
    public static settingsApiKeysPartialUpdate({
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
            url: '/api/settings/api-keys/{id}/',
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
    public static settingsApiKeysDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/api-keys/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * POST /api/settings/api-keys/{id}/revoke/ - Revoke an API key.
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsApiKeysRevokeCreate({
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
            method: 'POST',
            url: '/api/settings/api-keys/{id}/revoke/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * GET /api/settings/api-keys/{id}/usage/ - Get usage statistics.
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsApiKeysUsageRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/api-keys/{id}/usage/',
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
     * @returns PaginatedFacebookPageList
     * @throws ApiError
     */
    public static settingsFacebookPagesList({
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
    }): CancelablePromise<PaginatedFacebookPageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/facebook/pages/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
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
    public static settingsFacebookPagesCreate({
        requestBody,
    }: {
        requestBody: FacebookPageCreate,
    }): CancelablePromise<FacebookPageCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/facebook/pages/',
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
    public static settingsFacebookPagesRetrieve({
        id,
    }: {
        id: string,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/facebook/pages/{id}/',
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
    public static settingsFacebookPagesUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: FacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/facebook/pages/{id}/',
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
    public static settingsFacebookPagesPartialUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: PatchedFacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/facebook/pages/{id}/',
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
    public static settingsFacebookPagesDestroy({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/facebook/pages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Disconnect Facebook page.
     *
     * Deactivates the page and removes webhook subscriptions.
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsFacebookPagesDisconnectCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: FacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/facebook/pages/{id}/disconnect/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Test Facebook page connection.
     *
     * Verifies that the access token is valid and can access Facebook API.
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsFacebookPagesTestCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: FacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/facebook/pages/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * GET /api/settings/general/ - Retrieve general settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsGeneralRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/general/',
        });
    }
    /**
     * PATCH /api/settings/general/ - Update general settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsGeneralPartialUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/general/{id}/',
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
     * @returns PaginatedInstagramAccountList
     * @throws ApiError
     */
    public static settingsInstagramAccountsList({
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
    }): CancelablePromise<PaginatedInstagramAccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/instagram/accounts/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
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
    public static settingsInstagramAccountsCreate({
        requestBody,
    }: {
        requestBody: InstagramAccountCreate,
    }): CancelablePromise<InstagramAccountCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/instagram/accounts/',
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
    public static settingsInstagramAccountsRetrieve({
        id,
    }: {
        id: string,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/instagram/accounts/{id}/',
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
    public static settingsInstagramAccountsUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: InstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/instagram/accounts/{id}/',
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
    public static settingsInstagramAccountsPartialUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: PatchedInstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/instagram/accounts/{id}/',
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
    public static settingsInstagramAccountsDestroy({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/instagram/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Disconnect Instagram account.
     *
     * Deactivates the account and removes webhook subscriptions.
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsInstagramAccountsDisconnectCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: InstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/instagram/accounts/{id}/disconnect/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Test Instagram connection.
     *
     * Verifies that the access token is valid and can access Instagram API.
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsInstagramAccountsTestCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: InstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/instagram/accounts/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for integration logs (read-only).
     *
     * Endpoints:
     * - GET /api/settings/integration-logs/ - List logs
     * - GET /api/settings/integration-logs/{id}/ - Get log detail
     * - GET /api/settings/integration-logs/export/ - Export logs
     * - DELETE /api/settings/integration-logs/cleanup/ - Cleanup old logs
     * - GET /api/settings/integration-logs/stats/ - Get statistics
     * @returns PaginatedIntegrationLogList
     * @throws ApiError
     */
    public static settingsIntegrationLogsList({
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
    }): CancelablePromise<PaginatedIntegrationLogList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/integration-logs/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for integration logs (read-only).
     *
     * Endpoints:
     * - GET /api/settings/integration-logs/ - List logs
     * - GET /api/settings/integration-logs/{id}/ - Get log detail
     * - GET /api/settings/integration-logs/export/ - Export logs
     * - DELETE /api/settings/integration-logs/cleanup/ - Cleanup old logs
     * - GET /api/settings/integration-logs/stats/ - Get statistics
     * @returns IntegrationLog
     * @throws ApiError
     */
    public static settingsIntegrationLogsRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Integration Log.
         */
        id: string,
    }): CancelablePromise<IntegrationLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/integration-logs/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * DELETE /api/settings/integration-logs/cleanup/ - Delete old logs.
     * @returns void
     * @throws ApiError
     */
    public static settingsIntegrationLogsCleanupDestroy(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/integration-logs/cleanup/',
        });
    }
    /**
     * GET /api/settings/integration-logs/export/ - Export logs as CSV or JSON.
     * @returns IntegrationLog
     * @throws ApiError
     */
    public static settingsIntegrationLogsExportRetrieve(): CancelablePromise<IntegrationLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/integration-logs/export/',
        });
    }
    /**
     * GET /api/settings/integration-logs/stats/ - Get integration statistics.
     * @returns IntegrationLog
     * @throws ApiError
     */
    public static settingsIntegrationLogsStatsRetrieve(): CancelablePromise<IntegrationLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/integration-logs/stats/',
        });
    }
    /**
     * GET /api/settings/notifications/ - Get global notification settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsNotificationsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/notifications/',
        });
    }
    /**
     * PATCH /api/settings/notifications/ - Update global settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsNotificationsPartialUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/notifications/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * POST /api/settings/notifications/test/ - Send test notification.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsNotificationsTestCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/notifications/test/',
        });
    }
    /**
     * GET/PATCH /api/settings/notifications/user/ - User-specific settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsNotificationsUserRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/notifications/user/',
        });
    }
    /**
     * GET/PATCH /api/settings/notifications/user/ - User-specific settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsNotificationsUserPartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/notifications/user/',
        });
    }
    /**
     * GET /api/settings/security/ - Get security settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsSecurityRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/security/',
        });
    }
    /**
     * PATCH /api/settings/security/ - Update security settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsSecurityPartialUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/security/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * GET /api/settings/security/audit-log/ - Get security audit log.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsSecurityAuditLogRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/security/audit-log/',
        });
    }
    /**
     * GET /api/settings/security/sessions/ - List active sessions.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsSecuritySessionsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/security/sessions/',
        });
    }
    /**
     * DELETE /api/settings/security/sessions/{session_id}/ - Revoke specific session.
     * @returns void
     * @throws ApiError
     */
    public static settingsSecuritySessionsDestroy({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/security/sessions/{session_id}/',
            path: {
                'session_id': sessionId,
            },
        });
    }
    /**
     * POST /api/settings/security/sessions/revoke-all/ - Revoke all sessions except current.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsSecuritySessionsRevokeAllCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/security/sessions/revoke-all/',
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns PaginatedTelegramBotList
     * @throws ApiError
     */
    public static settingsTelegramBotsList({
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
    }): CancelablePromise<PaginatedTelegramBotList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/telegram/bots/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns TelegramBotCreate
     * @throws ApiError
     */
    public static settingsTelegramBotsCreate({
        requestBody,
    }: {
        requestBody: TelegramBotCreate,
    }): CancelablePromise<TelegramBotCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/telegram/bots/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsRetrieve({
        id,
    }: {
        id: string,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/telegram/bots/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: TelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/telegram/bots/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsPartialUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: PatchedTelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/telegram/bots/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns void
     * @throws ApiError
     */
    public static settingsTelegramBotsDestroy({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/telegram/bots/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Setup or update Telegram webhook.
     *
     * Configures the webhook URL for receiving updates from Telegram.
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsSetWebhookCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: TelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/telegram/bots/{id}/set_webhook/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Test Telegram bot connection.
     *
     * Calls Telegram API getMe to verify bot token is valid.
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsTestCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: TelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/telegram/bots/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns PaginatedWebhookList
     * @throws ApiError
     */
    public static settingsWebhooksList({
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
    }): CancelablePromise<PaginatedWebhookList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/webhooks/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns WebhookCreate
     * @throws ApiError
     */
    public static settingsWebhooksCreate({
        requestBody,
    }: {
        requestBody: WebhookCreate,
    }): CancelablePromise<WebhookCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/webhooks/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/webhooks/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
        requestBody: Webhook,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/webhooks/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
        requestBody?: PatchedWebhook,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/webhooks/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns void
     * @throws ApiError
     */
    public static settingsWebhooksDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/webhooks/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * GET /api/settings/webhooks/{id}/deliveries/ - Get delivery history.
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksDeliveriesRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/webhooks/{id}/deliveries/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * POST /api/settings/webhooks/{id}/deliveries/{delivery_id}/retry/ - Retry failed delivery.
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksDeliveriesRetryCreate({
        deliveryId,
        id,
        requestBody,
    }: {
        deliveryId: string,
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
        requestBody: Webhook,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/webhooks/{id}/deliveries/{delivery_id}/retry/',
            path: {
                'delivery_id': deliveryId,
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * POST /api/settings/webhooks/{id}/test/ - Test webhook with sample data.
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksTestCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
        requestBody: Webhook,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/webhooks/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
