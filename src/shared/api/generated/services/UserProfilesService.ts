/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedUserProfileList } from '../models/PaginatedUserProfileList';
import type { PatchedUserProfile } from '../models/PatchedUserProfile';
import type { UserProfile } from '../models/UserProfile';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserProfilesService {
    /**
     * CRUD API for user profiles
     * @returns PaginatedUserProfileList
     * @throws ApiError
     */
    public static profilesList({
        page,
        search,
        user,
    }: {
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * A search term.
         */
        search?: string,
        user?: number,
    }): CancelablePromise<PaginatedUserProfileList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/',
            query: {
                'page': page,
                'search': search,
                'user': user,
            },
        });
    }
    /**
     * CRUD API for user profiles
     * @returns UserProfile
     * @throws ApiError
     */
    public static profilesCreate({
        requestBody,
    }: {
        requestBody?: UserProfile,
    }): CancelablePromise<UserProfile> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profiles/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for user profiles
     * @returns UserProfile
     * @throws ApiError
     */
    public static profilesRetrieve({
        user,
    }: {
        /**
         * A unique value identifying this User profile.
         */
        user: number,
    }): CancelablePromise<UserProfile> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/{user}/',
            path: {
                'user': user,
            },
        });
    }
    /**
     * CRUD API for user profiles
     * @returns UserProfile
     * @throws ApiError
     */
    public static profilesUpdate({
        user,
        requestBody,
    }: {
        /**
         * A unique value identifying this User profile.
         */
        user: number,
        requestBody?: UserProfile,
    }): CancelablePromise<UserProfile> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/profiles/{user}/',
            path: {
                'user': user,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for user profiles
     * @returns UserProfile
     * @throws ApiError
     */
    public static profilesPartialUpdate({
        user,
        requestBody,
    }: {
        /**
         * A unique value identifying this User profile.
         */
        user: number,
        requestBody?: PatchedUserProfile,
    }): CancelablePromise<UserProfile> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/profiles/{user}/',
            path: {
                'user': user,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for user profiles
     * @returns void
     * @throws ApiError
     */
    public static profilesDestroy({
        user,
    }: {
        /**
         * A unique value identifying this User profile.
         */
        user: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/profiles/{user}/',
            path: {
                'user': user,
            },
        });
    }
    /**
     * Get or update current user's profile
     * @returns UserProfile
     * @throws ApiError
     */
    public static profilesMeRetrieve(): CancelablePromise<UserProfile> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/me/',
        });
    }
    /**
     * Get or update current user's profile
     * @returns UserProfile
     * @throws ApiError
     */
    public static profilesMeUpdate({
        requestBody,
    }: {
        requestBody?: UserProfile,
    }): CancelablePromise<UserProfile> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/profiles/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get or update current user's profile
     * @returns UserProfile
     * @throws ApiError
     */
    public static profilesMePartialUpdate({
        requestBody,
    }: {
        requestBody?: PatchedUserProfile,
    }): CancelablePromise<UserProfile> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/profiles/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Upload or delete user avatar
     * @returns UserProfile
     * @throws ApiError
     */
    public static profilesMeAvatarCreate({
        requestBody,
    }: {
        requestBody?: UserProfile,
    }): CancelablePromise<UserProfile> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/profiles/me/avatar/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Upload or delete user avatar
     * @returns void
     * @throws ApiError
     */
    public static profilesMeAvatarDestroy(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/profiles/me/avatar/',
        });
    }
}
