/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Connection } from '../models/Connection';
import type { IncomingCall } from '../models/IncomingCall';
import type { PaginatedConnectionList } from '../models/PaginatedConnectionList';
import type { PaginatedIncomingCallList } from '../models/PaginatedIncomingCallList';
import type { PatchedConnection } from '../models/PatchedConnection';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VoIpService {
    /**
     * @returns PaginatedConnectionList
     * @throws ApiError
     */
    public static voipConnectionsList({
        active,
        page,
        pageSize,
        provider,
    }: {
        active?: boolean,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * Specify VoIP service provider
         *
         * * `Zadarma` - Zadarma
         * * `OnlinePBX` - OnlinePBX
         * * `Asterisk` - Asterisk
         */
        provider?: 'Asterisk' | 'OnlinePBX' | 'Zadarma',
    }): CancelablePromise<PaginatedConnectionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/connections/',
            query: {
                'active': active,
                'page': page,
                'page_size': pageSize,
                'provider': provider,
            },
        });
    }
    /**
     * @returns Connection
     * @throws ApiError
     */
    public static voipConnectionsCreate({
        requestBody,
    }: {
        requestBody: Connection,
    }): CancelablePromise<Connection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/connections/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Connection
     * @throws ApiError
     */
    public static voipConnectionsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this connection.
         */
        id: number,
    }): CancelablePromise<Connection> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/connections/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Connection
     * @throws ApiError
     */
    public static voipConnectionsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this connection.
         */
        id: number,
        requestBody: Connection,
    }): CancelablePromise<Connection> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/voip/connections/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Connection
     * @throws ApiError
     */
    public static voipConnectionsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this connection.
         */
        id: number,
        requestBody?: PatchedConnection,
    }): CancelablePromise<Connection> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/voip/connections/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static voipConnectionsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this connection.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/voip/connections/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedIncomingCallList
     * @throws ApiError
     */
    public static voipIncomingCallsList({
        clientType,
        isConsumed,
        page,
        pageSize,
        search,
        user,
    }: {
        clientType?: string,
        isConsumed?: boolean,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
        user?: number,
    }): CancelablePromise<PaginatedIncomingCallList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/incoming-calls/',
            query: {
                'client_type': clientType,
                'is_consumed': isConsumed,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'user': user,
            },
        });
    }
    /**
     * @returns IncomingCall
     * @throws ApiError
     */
    public static voipIncomingCallsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Incoming call.
         */
        id: number,
    }): CancelablePromise<IncomingCall> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/incoming-calls/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
