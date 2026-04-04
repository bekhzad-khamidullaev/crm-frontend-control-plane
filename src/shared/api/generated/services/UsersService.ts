/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedUserList } from '../models/PaginatedUserList';
import type { PatchedUser } from '../models/PatchedUser';
import type { PatchedUserWrite } from '../models/PatchedUserWrite';
import type { User } from '../models/User';
import type { UserWrite } from '../models/UserWrite';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * User directory with admin CRUD, group assignment and permission assignment.
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
     * User directory with admin CRUD, group assignment and permission assignment.
     * @returns UserWrite
     * @throws ApiError
     */
    public static usersCreate({
        requestBody,
    }: {
        requestBody: UserWrite,
    }): CancelablePromise<UserWrite> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User directory with admin CRUD, group assignment and permission assignment.
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
     * User directory with admin CRUD, group assignment and permission assignment.
     * @returns UserWrite
     * @throws ApiError
     */
    public static usersUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this user.
         */
        id: number,
        requestBody: UserWrite,
    }): CancelablePromise<UserWrite> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User directory with admin CRUD, group assignment and permission assignment.
     * @returns UserWrite
     * @throws ApiError
     */
    public static usersPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this user.
         */
        id: number,
        requestBody?: PatchedUserWrite,
    }): CancelablePromise<UserWrite> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User directory with admin CRUD, group assignment and permission assignment.
     * @returns void
     * @throws ApiError
     */
    public static usersDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this user.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * User directory with admin CRUD, group assignment and permission assignment.
     * @returns UserWrite
     * @throws ApiError
     */
    public static usersGroupsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this user.
         */
        id: number,
        requestBody: UserWrite,
    }): CancelablePromise<UserWrite> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/{id}/groups/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User directory with admin CRUD, group assignment and permission assignment.
     * @returns UserWrite
     * @throws ApiError
     */
    public static usersGroupsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this user.
         */
        id: number,
        requestBody?: PatchedUserWrite,
    }): CancelablePromise<UserWrite> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{id}/groups/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User directory with admin CRUD, group assignment and permission assignment.
     * @returns UserWrite
     * @throws ApiError
     */
    public static usersPermissionsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this user.
         */
        id: number,
        requestBody: UserWrite,
    }): CancelablePromise<UserWrite> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/{id}/permissions/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User directory with admin CRUD, group assignment and permission assignment.
     * @returns UserWrite
     * @throws ApiError
     */
    public static usersPermissionsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this user.
         */
        id: number,
        requestBody?: PatchedUserWrite,
    }): CancelablePromise<UserWrite> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/{id}/permissions/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User directory with admin CRUD, group assignment and permission assignment.
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
     * User directory with admin CRUD, group assignment and permission assignment.
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
     * User directory with admin CRUD, group assignment and permission assignment.
     * @returns User
     * @throws ApiError
     */
    public static usersMe2FaStatusPartialUpdate({
        requestBody,
    }: {
        requestBody?: PatchedUser,
    }): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/me/2fa/status/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User directory with admin CRUD, group assignment and permission assignment.
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
     * User directory with admin CRUD, group assignment and permission assignment.
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
     * User directory with admin CRUD, group assignment and permission assignment.
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
     * User directory with admin CRUD, group assignment and permission assignment.
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
