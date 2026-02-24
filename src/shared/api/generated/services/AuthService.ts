/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthToken } from '../models/AuthToken';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Returns current authentication status and JWT token information.
     * Useful for debugging frontend authentication issues.
     * @returns any No response body
     * @throws ApiError
     */
    public static authStatusRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/status/',
        });
    }
    /**
     * @returns AuthToken
     * @throws ApiError
     */
    public static authTokenCreate({
        formData,
    }: {
        formData: AuthToken,
    }): CancelablePromise<AuthToken> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/token/',
            formData: formData,
            mediaType: 'application/x-www-form-urlencoded',
        });
    }
}
