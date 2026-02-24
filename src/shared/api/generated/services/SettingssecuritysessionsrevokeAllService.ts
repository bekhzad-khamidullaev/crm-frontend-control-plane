/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingssecuritysessionsrevokeAllService {
    /**
     * POST /api/settings/security/sessions/revoke-all/ - Revoke all sessions except current.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingssecuritysessionsrevokeAllCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/settings/security/sessions/revoke-all/',
        });
    }
}
