/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CustomTokenObtainPair } from '../models/CustomTokenObtainPair';
import type { TokenRefresh } from '../models/TokenRefresh';
import type { TokenVerify } from '../models/TokenVerify';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TokenService {
    /**
     * Custom JWT token view with enhanced claims
     * @returns CustomTokenObtainPair
     * @throws ApiError
     */
    public static tokenCreate({
        requestBody,
    }: {
        requestBody: CustomTokenObtainPair,
    }): CancelablePromise<CustomTokenObtainPair> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/token/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Takes a refresh type JSON web token and returns an access type JSON web
     * token if the refresh token is valid.
     * @returns TokenRefresh
     * @throws ApiError
     */
    public static tokenRefreshCreate({
        requestBody,
    }: {
        requestBody: TokenRefresh,
    }): CancelablePromise<TokenRefresh> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/token/refresh/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Takes a token and indicates if it is valid.  This view provides no
     * information about a token's fitness for a particular use.
     * @returns TokenVerify
     * @throws ApiError
     */
    public static tokenVerifyCreate({
        requestBody,
    }: {
        requestBody: TokenVerify,
    }): CancelablePromise<TokenVerify> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/token/verify/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
