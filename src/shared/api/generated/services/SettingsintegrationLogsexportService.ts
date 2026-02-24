/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntegrationLog } from '../models/IntegrationLog';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsintegrationLogsexportService {
    /**
     * GET /api/settings/integration-logs/export/ - Export logs as CSV or JSON.
     * @returns IntegrationLog
     * @throws ApiError
     */
    public static settingsintegrationLogsexportRetrieve(): CancelablePromise<IntegrationLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/integration-logs/export/',
        });
    }
}
