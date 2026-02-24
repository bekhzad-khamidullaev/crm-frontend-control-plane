/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { APIKey } from '../models/APIKey';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsapiKeysusageService {
    /**
     * GET /api/settings/api-keys/{id}/usage/ - Get usage statistics.
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsapiKeysusageRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/api-keys/{id}/usage/',
            path: {
                'id': id,
            },
        });
    }
}
