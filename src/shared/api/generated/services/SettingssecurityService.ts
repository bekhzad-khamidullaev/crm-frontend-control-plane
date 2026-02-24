/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingssecurityService {
    /**
     * GET /api/settings/security/ - Get security settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingssecurityRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/security/',
        });
    }
    /**
     * PATCH /api/settings/security/ - Update security settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingssecurityPartialUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/security/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
