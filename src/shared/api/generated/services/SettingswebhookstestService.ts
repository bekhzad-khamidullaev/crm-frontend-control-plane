/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Webhook } from '../models/Webhook';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingswebhookstestService {
    /**
     * POST /api/settings/webhooks/{id}/test/ - Test webhook with sample data.
     * @returns Webhook
     * @throws ApiError
     */
    public static settingswebhookstestCreate({
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
            url: '/settings/webhooks/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
