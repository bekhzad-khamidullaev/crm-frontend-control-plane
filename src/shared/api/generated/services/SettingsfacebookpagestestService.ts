/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FacebookPage } from '../models/FacebookPage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsfacebookpagestestService {
    /**
     * Test Facebook page connection.
     *
     * Verifies that the access token is valid and can access Facebook API.
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsfacebookpagestestCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: FacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/facebook/pages/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
