/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthStatusResponse } from '../models/AuthStatusResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * Get authentication statistics (JWT vs legacy token usage)
     * @returns any
     * @throws ApiError
     */
    public static authStatsRetrieve(): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth-stats/',
        });
    }
    /**
     * Check authentication status with JWT token info
     * @returns AuthStatusResponse
     * @throws ApiError
     */
    public static authStatusRetrieve(): CancelablePromise<AuthStatusResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/status/',
        });
    }
}
