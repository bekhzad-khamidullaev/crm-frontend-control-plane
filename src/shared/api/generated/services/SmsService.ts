/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SmsService {
    /**
     * Get SMS history
     *
     * Query params:
     * - limit: Number of messages to return (default: 50)
     * - channel_id: Filter by channel
     * @returns any No response body
     * @throws ApiError
     */
    public static smsHistoryRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sms/history/',
        });
    }
    /**
     * List available SMS providers
     * @returns any No response body
     * @throws ApiError
     */
    public static smsProvidersRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sms/providers/',
        });
    }
    /**
     * List available SMS providers
     * @returns any No response body
     * @throws ApiError
     */
    public static smsProvidersCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sms/providers/',
        });
    }
    /**
     * API endpoints for SMS operations
     * Wraps existing SMS functionality from integrations app
     * @returns any No response body
     * @throws ApiError
     */
    public static smsProvidersRetrieve2({
        providerId,
    }: {
        providerId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sms/providers/{provider_id}/',
            path: {
                'provider_id': providerId,
            },
        });
    }
    /**
     * API endpoints for SMS operations
     * Wraps existing SMS functionality from integrations app
     * @returns any No response body
     * @throws ApiError
     */
    public static smsProvidersUpdate({
        providerId,
    }: {
        providerId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/sms/providers/{provider_id}/',
            path: {
                'provider_id': providerId,
            },
        });
    }
    /**
     * API endpoints for SMS operations
     * Wraps existing SMS functionality from integrations app
     * @returns any No response body
     * @throws ApiError
     */
    public static smsProvidersPartialUpdate({
        providerId,
    }: {
        providerId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/sms/providers/{provider_id}/',
            path: {
                'provider_id': providerId,
            },
        });
    }
    /**
     * API endpoints for SMS operations
     * Wraps existing SMS functionality from integrations app
     * @returns void
     * @throws ApiError
     */
    public static smsProvidersDestroy({
        providerId,
    }: {
        providerId: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/sms/providers/{provider_id}/',
            path: {
                'provider_id': providerId,
            },
        });
    }
    /**
     * Send single SMS
     *
     * Required fields:
     * - channel_id: ID of the SMS provider channel
     * - to: Phone number
     * - text: Message content
     * - async: (optional) Send asynchronously via Celery (default: true)
     * @returns any No response body
     * @throws ApiError
     */
    public static smsSendCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sms/send/',
        });
    }
    /**
     * Send SMS to multiple recipients
     *
     * Required fields:
     * - channel_id: ID of the SMS provider channel
     * - phone_numbers: List of phone numbers
     * - text: Message content
     * @returns any No response body
     * @throws ApiError
     */
    public static smsSendBulkCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sms/send_bulk/',
        });
    }
    /**
     * Get SMS service status and statistics
     * @returns any No response body
     * @throws ApiError
     */
    public static smsStatusRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/sms/status/',
        });
    }
}
