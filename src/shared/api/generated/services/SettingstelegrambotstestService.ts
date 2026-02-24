/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TelegramBot } from '../models/TelegramBot';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingstelegrambotstestService {
    /**
     * Test Telegram bot connection.
     *
     * Calls Telegram API getMe to verify bot token is valid.
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingstelegrambotstestCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: TelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/telegram/bots/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
