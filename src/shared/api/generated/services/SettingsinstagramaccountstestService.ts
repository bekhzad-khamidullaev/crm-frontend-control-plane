/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InstagramAccount } from '../models/InstagramAccount';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsinstagramaccountstestService {
    /**
     * Test Instagram connection.
     *
     * Verifies that the access token is valid and can access Instagram API.
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsinstagramaccountstestCreate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: InstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/instagram/accounts/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
