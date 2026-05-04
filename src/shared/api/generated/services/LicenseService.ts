/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LicenseChallenge } from '../models/LicenseChallenge';
import type { LicenseCoverageSummary } from '../models/LicenseCoverageSummary';
import type { LicenseEntitlements } from '../models/LicenseEntitlements';
import type { LicenseErrorResponse } from '../models/LicenseErrorResponse';
import type { LicenseInstallRequest } from '../models/LicenseInstallRequest';
import type { LicenseInstallResponse } from '../models/LicenseInstallResponse';
import type { LicenseOperationsSummary } from '../models/LicenseOperationsSummary';
import type { LicenseRequestContext } from '../models/LicenseRequestContext';
import type { LicenseUxSummary } from '../models/LicenseUxSummary';
import type { LicenseVerifyRequest } from '../models/LicenseVerifyRequest';
import type { LicenseVerifyResponse } from '../models/LicenseVerifyResponse';
import type { PaginatedLicenseEntitlementsList } from '../models/PaginatedLicenseEntitlementsList';
import type { PaginatedLicenseEventList } from '../models/PaginatedLicenseEventList';
import type { PaginatedLicenseIncidentList } from '../models/PaginatedLicenseIncidentList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LicenseService {
    /**
     * @returns PaginatedLicenseEntitlementsList
     * @throws ApiError
     */
    public static licenseList({
        page,
        pageSize,
    }: {
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
    }): CancelablePromise<PaginatedLicenseEntitlementsList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/',
            query: {
                'page': page,
                'page_size': pageSize,
            },
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
     * @returns LicenseCoverageSummary
     * @throws ApiError
     */
    public static licenseCoverageSummaryRetrieve(): CancelablePromise<LicenseCoverageSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/coverage-summary/',
        });
    }
    /**
     * @returns PaginatedLicenseEventList
     * @throws ApiError
     */
    public static licenseEventsList({
        page,
        pageSize,
    }: {
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
    }): CancelablePromise<PaginatedLicenseEventList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/events/',
            query: {
                'page': page,
                'page_size': pageSize,
            },
        });
    }
    /**
     * @returns PaginatedLicenseIncidentList
     * @throws ApiError
     */
    public static licenseIncidentsList({
        page,
        pageSize,
    }: {
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
    }): CancelablePromise<PaginatedLicenseIncidentList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/incidents/',
            query: {
                'page': page,
                'page_size': pageSize,
            },
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
    public static licenseInstallBundleCreate({
        requestBody,
    }: {
        requestBody: LicenseEntitlements,
    }): CancelablePromise<LicenseInstallResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/license/install-bundle/',
            body: requestBody,
            mediaType: 'application/json',
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
     * @returns LicenseEntitlements
     * @throws ApiError
     */
    public static licenseObservabilityExportRetrieve(): CancelablePromise<LicenseEntitlements> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/observability-export/',
        });
    }
    /**
     * @returns LicenseEntitlements
     * @throws ApiError
     */
    public static licenseObservabilityIngestRetrieve(): CancelablePromise<LicenseEntitlements> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/observability-ingest/',
        });
    }
    /**
     * @returns LicenseOperationsSummary
     * @throws ApiError
     */
    public static licenseOperationsSummaryRetrieve(): CancelablePromise<LicenseOperationsSummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/license/operations-summary/',
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
