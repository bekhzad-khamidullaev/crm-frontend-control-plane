/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthToken } from '../models/AuthToken';
import type { ChallengeDispatchResponse } from '../models/ChallengeDispatchResponse';
import type { CustomTokenObtainPair } from '../models/CustomTokenObtainPair';
import type { PasswordResetConfirm } from '../models/PasswordResetConfirm';
import type { PasswordResetConfirmResponse } from '../models/PasswordResetConfirmResponse';
import type { PasswordResetRequest } from '../models/PasswordResetRequest';
import type { TwoFactorResend } from '../models/TwoFactorResend';
import type { TwoFactorVerify } from '../models/TwoFactorVerify';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * @returns ChallengeDispatchResponse
     * @throws ApiError
     */
    public static auth2FaResendCreate({
        requestBody,
    }: {
        requestBody: TwoFactorResend,
    }): CancelablePromise<ChallengeDispatchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/2fa/resend/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns CustomTokenObtainPair
     * @throws ApiError
     */
    public static auth2FaVerifyCreate({
        requestBody,
    }: {
        requestBody: TwoFactorVerify,
    }): CancelablePromise<CustomTokenObtainPair> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/2fa/verify/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PasswordResetConfirmResponse
     * @throws ApiError
     */
    public static authPasswordResetConfirmCreate({
        requestBody,
    }: {
        requestBody: PasswordResetConfirm,
    }): CancelablePromise<PasswordResetConfirmResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/password-reset/confirm/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ChallengeDispatchResponse
     * @throws ApiError
     */
    public static authPasswordResetRequestCreate({
        requestBody,
    }: {
        requestBody: PasswordResetRequest,
    }): CancelablePromise<ChallengeDispatchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/auth/password-reset/request/',
            body: requestBody,
            mediaType: 'application/json',
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
