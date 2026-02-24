/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingssecuritysessionsService {
    /**
     * GET /api/settings/security/sessions/ - List active sessions.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingssecuritysessionsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/security/sessions/',
        });
    }
    /**
     * DELETE /api/settings/security/sessions/{session_id}/ - Revoke specific session.
     * @returns void
     * @throws ApiError
     */
    public static settingssecuritysessionsDestroy({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/settings/security/sessions/{session_id}/',
            path: {
                'session_id': sessionId,
            },
        });
    }
}
