/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Webhook } from '../models/Webhook';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingswebhooksdeliveriesService {
    /**
     * GET /api/settings/webhooks/{id}/deliveries/ - Get delivery history.
     * @returns Webhook
     * @throws ApiError
     */
    public static settingswebhooksdeliveriesRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/webhooks/{id}/deliveries/',
            path: {
                'id': id,
            },
        });
    }
}
