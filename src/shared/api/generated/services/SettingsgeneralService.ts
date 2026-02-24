/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsgeneralService {
    /**
     * GET /api/settings/general/ - Retrieve general settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsgeneralRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/general/',
        });
    }
    /**
     * PATCH /api/settings/general/ - Update general settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsgeneralPartialUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/general/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
