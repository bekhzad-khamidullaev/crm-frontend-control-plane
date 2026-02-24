/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TelegramBot } from '../models/TelegramBot';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingstelegrambotssetWebhookService {
    /**
     * Setup or update Telegram webhook.
     *
     * Configures the webhook URL for receiving updates from Telegram.
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingstelegrambotssetWebhookCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: TelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/telegram/bots/{id}/set_webhook/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
