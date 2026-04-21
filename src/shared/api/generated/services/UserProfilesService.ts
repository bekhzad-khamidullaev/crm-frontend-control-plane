/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedUserProfileList } from '../models/PaginatedUserProfileList';
import type { PatchedTelephonyCredentials } from '../models/PatchedTelephonyCredentials';
import type { PatchedUserProfile } from '../models/PatchedUserProfile';
import type { PatchedUserSoftphoneSettings } from '../models/PatchedUserSoftphoneSettings';
import type { TelephonyCredentials } from '../models/TelephonyCredentials';
import type { UserProfile } from '../models/UserProfile';
import type { UserSoftphoneSettings } from '../models/UserSoftphoneSettings';
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
        pageSize,
        search,
        user,
    }: {
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
    }): CancelablePromise<PaginatedUserProfileList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/',
            query: {
                'page': page,
                'page_size': pageSize,
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
    /**
     * User-facing browser softphone settings.
     * Allows per-user JsSIP/WebRTC overrides while keeping PBX credentials and
     * system Asterisk integration separate.
     * @returns UserSoftphoneSettings
     * @throws ApiError
     */
    public static profilesMeSoftphoneSettingsRetrieve(): CancelablePromise<UserSoftphoneSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/me/softphone-settings/',
        });
    }
    /**
     * User-facing browser softphone settings.
     * Allows per-user JsSIP/WebRTC overrides while keeping PBX credentials and
     * system Asterisk integration separate.
     * @returns UserSoftphoneSettings
     * @throws ApiError
     */
    public static profilesMeSoftphoneSettingsPartialUpdate({
        requestBody,
    }: {
        requestBody?: PatchedUserSoftphoneSettings,
    }): CancelablePromise<UserSoftphoneSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/profiles/me/softphone-settings/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Single-source-of-truth user telephony credentials endpoint.
     * User can access only own credentials; runtime PBX/WSS settings stay in VoIP system settings.
     * @returns TelephonyCredentials
     * @throws ApiError
     */
    public static profilesMeTelephonyCredentialsRetrieve(): CancelablePromise<TelephonyCredentials> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/profiles/me/telephony-credentials/',
        });
    }
    /**
     * Single-source-of-truth user telephony credentials endpoint.
     * User can access only own credentials; runtime PBX/WSS settings stay in VoIP system settings.
     * @returns TelephonyCredentials
     * @throws ApiError
     */
    public static profilesMeTelephonyCredentialsPartialUpdate({
        requestBody,
    }: {
        requestBody?: PatchedTelephonyCredentials,
    }): CancelablePromise<TelephonyCredentials> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/profiles/me/telephony-credentials/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
