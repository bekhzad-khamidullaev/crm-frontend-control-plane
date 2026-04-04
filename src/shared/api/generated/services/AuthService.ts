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
     * @returns any No response body
     * @throws ApiError
     */
    public static auth2FaResendCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/2fa/resend/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static auth2FaVerifyCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/2fa/verify/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static authPasswordResetConfirmCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/password-reset/confirm/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static authPasswordResetRequestCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/password-reset/request/',
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
