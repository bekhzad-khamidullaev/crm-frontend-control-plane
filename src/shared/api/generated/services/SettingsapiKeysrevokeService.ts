/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { APIKey } from '../models/APIKey';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsapiKeysrevokeService {
    /**
     * POST /api/settings/api-keys/{id}/revoke/ - Revoke an API key.
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsapiKeysrevokeCreate({
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
            url: '/settings/api-keys/{id}/revoke/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
