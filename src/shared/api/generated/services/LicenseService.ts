/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LicenseService {
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static licenseRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static licenseMeRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/me/',
        });
    }
}
