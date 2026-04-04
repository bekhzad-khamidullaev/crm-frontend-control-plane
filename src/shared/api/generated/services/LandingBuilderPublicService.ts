/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FunnelEvent } from '../models/FunnelEvent';
import type { PublicFunnelEventCreate } from '../models/PublicFunnelEventCreate';
import type { PublicLeadSubmit } from '../models/PublicLeadSubmit';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LandingBuilderPublicService {
    /**
     * @returns FunnelEvent
     * @throws ApiError
     */
    public static publicFunnelEventsCreate({
        requestBody,
    }: {
        requestBody: PublicFunnelEventCreate,
    }): CancelablePromise<FunnelEvent> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/public/funnel-events/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static publicLandingsRetrieve({
        slug,
    }: {
        slug: string,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/public/landings/{slug}/',
            path: {
                'slug': slug,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static publicLandingsLeadCreate({
        slug,
        requestBody,
    }: {
        slug: string,
        requestBody: PublicLeadSubmit,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/public/landings/{slug}/lead/',
            path: {
                'slug': slug,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static publicLandingsPreviewRetrieve({
        slug,
        token,
    }: {
        slug: string,
        token: string,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/public/landings/{slug}/preview/',
            path: {
                'slug': slug,
            },
            query: {
                'token': token,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static publicLandingsByDomainRetrieve({
        domain,
    }: {
        /**
         * Custom domain (optional). If omitted, Host header is used.
         */
        domain?: string,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/public/landings/by-domain/',
            query: {
                'domain': domain,
            },
        });
    }
}
