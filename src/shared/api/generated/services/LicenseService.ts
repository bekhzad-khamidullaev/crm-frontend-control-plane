/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LicenseChallenge } from '../models/LicenseChallenge';
import type { LicenseEntitlements } from '../models/LicenseEntitlements';
import type { LicenseErrorResponse } from '../models/LicenseErrorResponse';
import type { LicenseEvent } from '../models/LicenseEvent';
import type { LicenseInstallRequest } from '../models/LicenseInstallRequest';
import type { LicenseInstallResponse } from '../models/LicenseInstallResponse';
import type { LicenseRequestContext } from '../models/LicenseRequestContext';
import type { LicenseUxSummary } from '../models/LicenseUxSummary';
import type { LicenseVerifyRequest } from '../models/LicenseVerifyRequest';
import type { LicenseVerifyResponse } from '../models/LicenseVerifyResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LicenseService {
    /**
     * @returns LicenseEntitlements
     * @throws ApiError
     */
    public static licenseList(): CancelablePromise<Array<LicenseEntitlements>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/',
        });
    }
    /**
     * @returns LicenseChallenge
     * @throws ApiError
     */
    public static licenseChallengeRetrieve(): CancelablePromise<LicenseChallenge> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/challenge/',
        });
    }
    /**
     * @returns LicenseEvent
     * @throws ApiError
     */
    public static licenseEventsList(): CancelablePromise<Array<LicenseEvent>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/events/',
        });
    }
    /**
     * @returns LicenseInstallResponse
     * @throws ApiError
     */
    public static licenseInstallCreate({
        requestBody,
    }: {
        requestBody: LicenseInstallRequest,
    }): CancelablePromise<LicenseInstallResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/license/install/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseInstallResponse
     * @throws ApiError
     */
    public static licenseInstallBundleCreate(): CancelablePromise<LicenseInstallResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/license/install-bundle/',
        });
    }
    /**
     * @returns LicenseEntitlements
     * @throws ApiError
     */
    public static licenseMeRetrieve(): CancelablePromise<LicenseEntitlements> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/me/',
        });
    }
    /**
     * @returns LicenseInstallResponse
     * @returns LicenseErrorResponse
     * @throws ApiError
     */
    public static licenseRequestLicenseCreate({
        requestBody,
    }: {
        requestBody?: LicenseRequestContext,
    }): CancelablePromise<LicenseInstallResponse | LicenseErrorResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/license/request-license/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LicenseUxSummary
     * @throws ApiError
     */
    public static licenseUxSummaryRetrieve(): CancelablePromise<LicenseUxSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/ux-summary/',
        });
    }
    /**
     * @returns LicenseVerifyResponse
     * @throws ApiError
     */
    public static licenseVerifyCreate({
        requestBody,
    }: {
        requestBody: LicenseVerifyRequest,
    }): CancelablePromise<LicenseVerifyResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/license/verify/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
