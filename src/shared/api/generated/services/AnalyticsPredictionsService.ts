/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AnalyticsPredictionsService {
    /**
     * Get clients forecast data
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsclientsforecastRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/predictions/clients/forecast/',
        });
    }
    /**
     * Trigger clients prediction task
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsclientspredictCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/predictions/clients/predict/',
        });
    }
    /**
     * Get leads forecast data
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsleadsforecastRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/predictions/leads/forecast/',
        });
    }
    /**
     * Trigger leads prediction task
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsleadspredictCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/predictions/leads/predict/',
        });
    }
    /**
     * Get predicted next actions for clients
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsnextActionsclientsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/predictions/next-actions/clients/',
        });
    }
    /**
     * Trigger next actions prediction for clients
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsnextActionsclientspredictCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/predictions/next-actions/clients/predict/',
        });
    }
    /**
     * Get predicted next actions for deals
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsnextActionsdealsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/predictions/next-actions/deals/',
        });
    }
    /**
     * Trigger next actions prediction for deals
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsnextActionspredictCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/predictions/next-actions/predict/',
        });
    }
    /**
     * Trigger all prediction tasks
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionspredictAllCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/predictions/predict-all/',
        });
    }
    /**
     * Get revenue forecast data
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsrevenueforecastRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/predictions/revenue/forecast/',
        });
    }
    /**
     * Trigger revenue prediction task
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsrevenuepredictCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/predictions/revenue/predict/',
        });
    }
    /**
     * Get overall prediction status
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsstatusRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/predictions/status/',
        });
    }
}
