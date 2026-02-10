/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VoIpColdCallsService {
    /**
     * Get call logs with filtering
     *
     * Query params:
     * - direction: inbound/outbound/internal
     * - status: ringing/answered/busy/no_answer/failed
     * - limit: Number of records (default: 50)
     * - date_from: ISO datetime
     * - date_to: ISO datetime
     * @returns any No response body
     * @throws ApiError
     */
    public static voipCallLogsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/call-logs/',
        });
    }
    /**
     * Get detailed information about a specific call
     * @returns any No response body
     * @throws ApiError
     */
    public static voipCallLogsRetrieve2({
        logId,
    }: {
        logId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/call-logs/{log_id}/',
            path: {
                'log_id': logId,
            },
        });
    }
    /**
     * Add a note to a call log
     * @returns any No response body
     * @throws ApiError
     */
    public static voipCallLogsAddNoteCreate({
        logId,
    }: {
        logId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/call-logs/{log_id}/add-note/',
            path: {
                'log_id': logId,
            },
        });
    }
    /**
     * Get current call queue status
     * @returns any No response body
     * @throws ApiError
     */
    public static voipCallQueueRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/call-queue/',
        });
    }
    /**
     * Get call statistics for dashboard
     *
     * Query params:
     * - period: today/week/month (default: today)
     * @returns any No response body
     * @throws ApiError
     */
    public static voipCallStatisticsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/call-statistics/',
        });
    }
    /**
     * Schedule multiple cold calls in bulk
     *
     * Required fields:
     * - phone_numbers: List of phone numbers
     *
     * Optional fields:
     * - from_number: Caller ID to use
     * - campaign_id: Campaign ID
     * - delay_between_calls: Seconds between calls (default: 30)
     * @returns any No response body
     * @throws ApiError
     */
    public static voipColdCallBulkCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/cold-call/bulk/',
        });
    }
    /**
     * Initiate a cold call immediately
     *
     * Required fields:
     * - to_number: Phone number to call
     * - from_number: (optional) Caller ID to use
     * - lead_id: (optional) Lead ID
     * - contact_id: (optional) Contact ID
     * - campaign_id: (optional) Campaign ID
     * @returns any No response body
     * @throws ApiError
     */
    public static voipColdCallInitiateCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/cold-call/initiate/',
        });
    }
    /**
     * Schedule a cold call for later
     *
     * Required fields:
     * - to_number OR lead_id OR contact_id
     *
     * Optional fields:
     * - from_number: Caller ID to use
     * - scheduled_time: ISO format datetime (e.g., "2024-01-15T14:30:00Z")
     * - campaign_id: Campaign ID
     * @returns any No response body
     * @throws ApiError
     */
    public static voipColdCallScheduleCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/cold-call/schedule/',
        });
    }
}
