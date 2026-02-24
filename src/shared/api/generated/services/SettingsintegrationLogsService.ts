/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntegrationLog } from '../models/IntegrationLog';
import type { PaginatedIntegrationLogList } from '../models/PaginatedIntegrationLogList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsintegrationLogsService {
    /**
     * ViewSet for integration logs (read-only).
     *
     * Endpoints:
     * - GET /api/settings/integration-logs/ - List logs
     * - GET /api/settings/integration-logs/{id}/ - Get log detail
     * - GET /api/settings/integration-logs/export/ - Export logs
     * - DELETE /api/settings/integration-logs/cleanup/ - Cleanup old logs
     * - GET /api/settings/integration-logs/stats/ - Get statistics
     * @returns PaginatedIntegrationLogList
     * @throws ApiError
     */
    public static settingsintegrationLogsList({
        ordering,
        page,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedIntegrationLogList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/integration-logs/',
            query: {
                'ordering': ordering,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for integration logs (read-only).
     *
     * Endpoints:
     * - GET /api/settings/integration-logs/ - List logs
     * - GET /api/settings/integration-logs/{id}/ - Get log detail
     * - GET /api/settings/integration-logs/export/ - Export logs
     * - DELETE /api/settings/integration-logs/cleanup/ - Cleanup old logs
     * - GET /api/settings/integration-logs/stats/ - Get statistics
     * @returns IntegrationLog
     * @throws ApiError
     */
    public static settingsintegrationLogsRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Integration Log.
         */
        id: string,
    }): CancelablePromise<IntegrationLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/integration-logs/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
