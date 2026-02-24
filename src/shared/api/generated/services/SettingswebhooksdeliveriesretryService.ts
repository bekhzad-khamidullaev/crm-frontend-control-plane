/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Webhook } from '../models/Webhook';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingswebhooksdeliveriesretryService {
    /**
     * POST /api/settings/webhooks/{id}/deliveries/{delivery_id}/retry/ - Retry failed delivery.
     * @returns Webhook
     * @throws ApiError
     */
    public static settingswebhooksdeliveriesretryCreate({
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
            url: '/settings/webhooks/{id}/deliveries/{delivery_id}/retry/',
            path: {
                'delivery_id': deliveryId,
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
