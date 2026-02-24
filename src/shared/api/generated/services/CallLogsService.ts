/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CallLog } from '../models/CallLog';
import type { PaginatedCallLogList } from '../models/PaginatedCallLogList';
import type { PatchedCallLog } from '../models/PatchedCallLog';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CallLogsService {
    /**
     * Create and list telephony call logs.
     * @returns PaginatedCallLogList
     * @throws ApiError
     */
    public static callLogsList({
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
    }): CancelablePromise<PaginatedCallLogList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/call-logs/',
            query: {
                'ordering': ordering,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * Create and list telephony call logs.
     * @returns CallLog
     * @throws ApiError
     */
    public static callLogsCreate({
        requestBody,
    }: {
        requestBody: CallLog,
    }): CancelablePromise<CallLog> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/call-logs/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create and list telephony call logs.
     * @returns CallLog
     * @throws ApiError
     */
    public static callLogsRetrieve({
        id,
    }: {
        id: string,
    }): CancelablePromise<CallLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/call-logs/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Create and list telephony call logs.
     * @returns CallLog
     * @throws ApiError
     */
    public static callLogsUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: CallLog,
    }): CancelablePromise<CallLog> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/call-logs/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create and list telephony call logs.
     * @returns CallLog
     * @throws ApiError
     */
    public static callLogsPartialUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: PatchedCallLog,
    }): CancelablePromise<CallLog> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/call-logs/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create and list telephony call logs.
     * @returns void
     * @throws ApiError
     */
    public static callLogsDestroy({
        id,
    }: {
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/call-logs/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
