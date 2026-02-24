/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedTelegramBotList } from '../models/PaginatedTelegramBotList';
import type { PatchedTelegramBot } from '../models/PatchedTelegramBot';
import type { TelegramBot } from '../models/TelegramBot';
import type { TelegramBotCreate } from '../models/TelegramBotCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingstelegrambotsService {
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
    public static settingstelegrambotsList({
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
    }): CancelablePromise<PaginatedTelegramBotList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/telegram/bots/',
            query: {
                'ordering': ordering,
                'page': page,
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
    public static settingstelegrambotsCreate({
        requestBody,
    }: {
        requestBody: TelegramBotCreate,
    }): CancelablePromise<TelegramBotCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/telegram/bots/',
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
    public static settingstelegrambotsRetrieve({
        id,
    }: {
        id: string,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/telegram/bots/{id}/',
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
    public static settingstelegrambotsUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: TelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/settings/telegram/bots/{id}/',
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
    public static settingstelegrambotsPartialUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: PatchedTelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/telegram/bots/{id}/',
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
    public static settingstelegrambotsDestroy({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/settings/telegram/bots/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
