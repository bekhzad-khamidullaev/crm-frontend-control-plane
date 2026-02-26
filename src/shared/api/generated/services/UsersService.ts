/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedUserList } from '../models/PaginatedUserList';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Read-only user directory.
     * @returns PaginatedUserList
     * @throws ApiError
     */
    public static usersList({
        ordering,
        page,
        pageSize,
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
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedUserList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Read-only user directory.
     * @returns User
     * @throws ApiError
     */
    public static usersRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this user.
         */
        id: number,
    }): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Read-only user directory.
     * @returns User
     * @throws ApiError
     */
    public static usersMeRetrieve(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/',
        });
    }
    /**
     * Read-only user directory.
     * @returns User
     * @throws ApiError
     */
    public static usersMe2FaStatusRetrieve(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/2fa/status/',
        });
    }
    /**
     * Read-only user directory.
     * @returns User
     * @throws ApiError
     */
    public static usersMeChangePasswordCreate({
        requestBody,
    }: {
        requestBody: User,
    }): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/me/change-password/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Read-only user directory.
     * @returns User
     * @throws ApiError
     */
    public static usersMeSessionsRetrieve(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/sessions/',
        });
    }
    /**
     * Read-only user directory.
     * @returns void
     * @throws ApiError
     */
    public static usersMeSessionsDestroy(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/me/sessions/',
        });
    }
    /**
     * Read-only user directory.
     * @returns User
     * @throws ApiError
     */
    public static usersMeSessionsRevokeAllCreate({
        requestBody,
    }: {
        requestBody: User,
    }): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/me/sessions/revoke-all/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
