/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthstatusService {
    /**
     * Returns current authentication status and JWT token information.
     * Useful for debugging frontend authentication issues.
     * @returns any No response body
     * @throws ApiError
     */
    public static authstatusRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/auth/status/',
        });
    }
}
