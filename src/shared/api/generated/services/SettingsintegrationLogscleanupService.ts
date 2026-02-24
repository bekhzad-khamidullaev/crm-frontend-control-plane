/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsintegrationLogscleanupService {
    /**
     * DELETE /api/settings/integration-logs/cleanup/ - Delete old logs.
     * @returns void
     * @throws ApiError
     */
    public static settingsintegrationLogscleanupDestroy(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/settings/integration-logs/cleanup/',
        });
    }
}
