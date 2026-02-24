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
    public static smshistoryRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sms/history/',
        });
    }
    /**
     * List available SMS providers
     * @returns any No response body
     * @throws ApiError
     */
    public static smsprovidersRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sms/providers/',
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
    public static smssendCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sms/send/',
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
    public static smssendBulkCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/sms/send_bulk/',
        });
    }
    /**
     * Get SMS service status and statistics
     * @returns any No response body
     * @throws ApiError
     */
    public static smsstatusRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/sms/status/',
        });
    }
}
