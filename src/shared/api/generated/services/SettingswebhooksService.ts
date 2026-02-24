/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedWebhookList } from '../models/PaginatedWebhookList';
import type { PatchedWebhook } from '../models/PatchedWebhook';
import type { Webhook } from '../models/Webhook';
import type { WebhookCreate } from '../models/WebhookCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingswebhooksService {
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
    public static settingswebhooksList({
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
    }): CancelablePromise<PaginatedWebhookList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/webhooks/',
            query: {
                'ordering': ordering,
                'page': page,
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
    public static settingswebhooksCreate({
        requestBody,
    }: {
        requestBody: WebhookCreate,
    }): CancelablePromise<WebhookCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/webhooks/',
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
    public static settingswebhooksRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/webhooks/{id}/',
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
    public static settingswebhooksUpdate({
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
            url: '/settings/webhooks/{id}/',
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
    public static settingswebhooksPartialUpdate({
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
            url: '/settings/webhooks/{id}/',
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
    public static settingswebhooksDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/settings/webhooks/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
