/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CustomTokenObtainPair } from '../models/CustomTokenObtainPair';
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
            url: '/token/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
