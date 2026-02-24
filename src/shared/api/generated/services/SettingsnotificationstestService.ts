/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsnotificationstestService {
    /**
     * POST /api/settings/notifications/test/ - Send test notification.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsnotificationstestCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/notifications/test/',
        });
    }
}
