/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsnotificationsService {
    /**
     * GET /api/settings/notifications/ - Get global notification settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsnotificationsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/notifications/',
        });
    }
    /**
     * PATCH /api/settings/notifications/ - Update global settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsnotificationsPartialUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/notifications/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
