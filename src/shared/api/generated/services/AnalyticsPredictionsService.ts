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
    public static predictionsClientsForecastRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/predictions/clients/forecast/',
        });
    }
    /**
     * Trigger clients prediction task
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsClientsPredictCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/predictions/clients/predict/',
        });
    }
    /**
     * Generate deterministic or AI-powered summary for forecast scenarios.
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsInsightsSummaryCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/predictions/insights/summary/',
        });
    }
    /**
     * Get leads forecast data
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsLeadsForecastRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/predictions/leads/forecast/',
        });
    }
    /**
     * Trigger leads prediction task
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsLeadsPredictCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/predictions/leads/predict/',
        });
    }
    /**
     * Get predicted next actions for clients
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsNextActionsClientsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/predictions/next-actions/clients/',
        });
    }
    /**
     * Trigger next actions prediction for clients
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsNextActionsClientsPredictCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/predictions/next-actions/clients/predict/',
        });
    }
    /**
     * Get predicted next actions for deals
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsNextActionsDealsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/predictions/next-actions/deals/',
        });
    }
    /**
     * Trigger next actions prediction for deals
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsNextActionsPredictCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/predictions/next-actions/predict/',
        });
    }
    /**
     * Trigger all prediction tasks
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsPredictAllCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/predictions/predict-all/',
        });
    }
    /**
     * Get revenue forecast data
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsRevenueForecastRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/predictions/revenue/forecast/',
        });
    }
    /**
     * Trigger revenue prediction task
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsRevenuePredictCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/predictions/revenue/predict/',
        });
    }
    /**
     * Build scenario planning data (base/upside/downside) from latest forecasts.
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsScenariosRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/predictions/scenarios/',
        });
    }
    /**
     * Get overall prediction status
     * @returns any No response body
     * @throws ApiError
     */
    public static predictionsStatusRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/predictions/status/',
        });
    }
}
