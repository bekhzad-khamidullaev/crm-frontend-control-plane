/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FacebookPage } from '../models/FacebookPage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsfacebookpagesdisconnectService {
    /**
     * Disconnect Facebook page.
     *
     * Deactivates the page and removes webhook subscriptions.
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsfacebookpagesdisconnectCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: FacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/facebook/pages/{id}/disconnect/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
