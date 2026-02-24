/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsnotificationsuserService {
    /**
     * GET/PATCH /api/settings/notifications/user/ - User-specific settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsnotificationsuserRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/notifications/user/',
        });
    }
    /**
     * GET/PATCH /api/settings/notifications/user/ - User-specific settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsnotificationsuserPartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/notifications/user/',
        });
    }
}
