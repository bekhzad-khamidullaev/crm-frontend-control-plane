/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AgentPresence } from '../models/AgentPresence';
import type { CallControlRequest } from '../models/CallControlRequest';
import type { CallControlResponse } from '../models/CallControlResponse';
import type { CallRoutingResponse } from '../models/CallRoutingResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VoIpColdCallsService {
    /**
     * Get currently active calls for current user scope.
     * @returns any No response body
     * @throws ApiError
     */
    public static voipActiveCallsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/active-calls/',
        });
    }
    /**
     * List agent presence status with real SIP registration check via AMI PJSIPShowContacts.
     * GET /api/voip/call-control/agent-presence/
     *
     * Checks which extensions are actually registered in Asterisk (PJSIP contacts),
     * not just whether a SIP account exists in the DB.
     * Result is cached for 30 seconds to avoid excessive AMI connections.
     * @returns AgentPresence
     * @throws ApiError
     */
    public static voipCallControlAgentPresenceList(): CancelablePromise<Array<AgentPresence>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/call-control/agent-presence/',
        });
    }
    /**
     * Request call hangup by session_id from CRM side.
     * @returns any No response body
     * @throws ApiError
     */
    public static voipCallControlHangupCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/call-control/hangup/',
        });
    }
    /**
     * Unified incoming call control contract for frontend runtime.
     * @returns any No response body
     * @throws ApiError
     */
    public static voipCallControlIncomingActionCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/call-control/incoming-action/',
        });
    }
    /**
     * Park a call.
     * POST /api/voip/call-control/park/
     * Body: {"call_id": "..."} or {"channel": "..."}
     * @returns CallControlResponse
     * @throws ApiError
     */
    public static voipCallControlParkCreate({
        requestBody,
    }: {
        requestBody: CallControlRequest,
    }): CancelablePromise<CallControlResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/call-control/park/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Redirect a call to a different extension.
     * POST /api/voip/call-control/redirect/
     * Body: {"call_id": "...", "exten": "1001"} or {"channel": "...", "exten": "1001"}
     * @returns CallControlResponse
     * @throws ApiError
     */
    public static voipCallControlRedirectCreate({
        requestBody,
    }: {
        requestBody: CallControlRequest,
    }): CancelablePromise<CallControlResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/call-control/redirect/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject inbound ringing call by session_id.
     * @returns any No response body
     * @throws ApiError
     */
    public static voipCallControlRejectCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/call-control/reject/',
        });
    }
    /**
     * Resolve where an incoming call from a given number should be routed.
     * Returns the target extension (CRM owner's SIP extension), match info.
     *
     * GET /api/voip/call-control/resolve-routing/?caller_id=+998901234567&called_number=100
     * @returns CallRoutingResponse
     * @throws ApiError
     */
    public static voipCallControlResolveRoutingRetrieve(): CancelablePromise<CallRoutingResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/call-control/resolve-routing/',
        });
    }
    /**
     * Blind transfer a call to another extension.
     * POST /api/voip/call-control/transfer/
     * Body: {"call_id": "...", "exten": "1001"} or {"channel": "...", "exten": "1001"}
     * @returns CallControlResponse
     * @throws ApiError
     */
    public static voipCallControlTransferCreate({
        requestBody,
    }: {
        requestBody: CallControlRequest,
    }): CancelablePromise<CallControlResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/call-control/transfer/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
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
    public static voipCallLogsList(): CancelablePromise<any> {
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
    public static voipCallLogsRetrieveById({
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
     * Add a note and optional wrap-up payload to a call log
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
     * CDR (Call Detail Record) reporting endpoint.
     * Returns aggregated statistics and detailed call records.
     *
     * Query parameters:
     * - date_from: ISO date (default: 7 days ago)
     * - date_to: ISO date (default: today)
     * - user_id: filter by user
     * - direction: inbound/outbound/internal
     * - status: filtering by call status
     * - group_by: day/week/month/user/direction (default: day)
     * - page, page_size: pagination
     * @returns any No response body
     * @throws ApiError
     */
    public static voipCdrReportRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/cdr-report/',
        });
    }
    /**
     * API endpoints for VoIP operations including cold calls
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
     * API endpoints for VoIP operations including cold calls
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
     * API endpoints for VoIP operations including cold calls
     * @returns any No response body
     * @throws ApiError
     */
    public static voipColdCallScheduleCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/cold-call/schedule/',
        });
    }
    /**
     * Drilldown by teams (routing groups) and agents.
     * @returns any No response body
     * @throws ApiError
     */
    public static voipContactCenterDrilldownRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/contact-center-drilldown/',
        });
    }
    /**
     * KPI economics for contact center:
     * AHT, ASA, FCR, abandon rate, SLA breach rate, conversion by direction.
     * @returns any No response body
     * @throws ApiError
     */
    public static voipContactCenterKpiRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/contact-center-kpi/',
        });
    }
    /**
     * Get recent incoming calls for current user
     * @returns any No response body
     * @throws ApiError
     */
    public static voipIncomingCallsFeedRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/incoming-calls-feed/',
        });
    }
    /**
     * API endpoints for VoIP operations including cold calls
     * @returns any
     * @throws ApiError
     */
    public static voipIncomingContext({
        phone,
        callId,
        callerName,
        channelType,
    }: {
        /**
         * Incoming caller phone number
         */
        phone: string,
        /**
         * External call id
         */
        callId?: string,
        /**
         * Caller display name
         */
        callerName?: string,
        /**
         * Telephony channel type (asterisk, onlinepbx, freeswitch, ...)
         */
        channelType?: string,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/incoming-context/',
            query: {
                'call_id': callId,
                'caller_name': callerName,
                'channel_type': channelType,
                'phone': phone,
            },
        });
    }
    /**
     * API endpoints for VoIP operations including cold calls
     * @returns any
     * @throws ApiError
     */
    public static voipIncomingContextExecute({
        requestBody,
    }: {
        requestBody?: Record<string, any>,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/incoming-context/execute/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get VoIP connections for current user
     * @returns any No response body
     * @throws ApiError
     */
    public static voipMyConnectionsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/my-connections/',
        });
    }
    /**
     * API endpoints for VoIP operations including cold calls
     * @returns any No response body
     * @throws ApiError
     */
    public static voipPilotWeeklyReportsList(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/pilot-weekly-reports/',
        });
    }
    /**
     * API endpoints for VoIP operations including cold calls
     * @returns any No response body
     * @throws ApiError
     */
    public static voipPilotWeeklyReportRetrieve({
        reportId,
    }: {
        reportId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/pilot-weekly-reports/{report_id}/',
            path: {
                'report_id': reportId,
            },
        });
    }
    /**
     * API endpoints for VoIP operations including cold calls
     * @returns any No response body
     * @throws ApiError
     */
    public static voipPilotWeeklyReportExportRetrieve({
        reportId,
    }: {
        reportId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/pilot-weekly-reports/{report_id}/export/',
            path: {
                'report_id': reportId,
            },
        });
    }
    /**
     * API endpoints for VoIP operations including cold calls
     * @returns any No response body
     * @throws ApiError
     */
    public static voipPilotWeeklyReportsAutomationHealthRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/pilot-weekly-reports/automation-health/',
        });
    }
    /**
     * API endpoints for VoIP operations including cold calls
     * @returns any No response body
     * @throws ApiError
     */
    public static voipPilotWeeklyReportsGenerateCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/pilot-weekly-reports/generate/',
        });
    }
    /**
     * API endpoints for VoIP operations including cold calls
     * @returns any No response body
     * @throws ApiError
     */
    public static voipPilotWeeklyReportsRunAutomationNowCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/pilot-weekly-reports/run-automation-now/',
        });
    }
    /**
     * Manage QA scoring workflow for calls:
     * - GET: list scores
     * - POST: create or update current user's score for a call
     * @returns any No response body
     * @throws ApiError
     */
    public static voipQaScoresRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/qa-scores/',
        });
    }
    /**
     * Manage QA scoring workflow for calls:
     * - GET: list scores
     * - POST: create or update current user's score for a call
     * @returns any No response body
     * @throws ApiError
     */
    public static voipQaScoresCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/qa-scores/',
        });
    }
    /**
     * QA summary dashboard:
     * score averages, pass-rate, outcome distribution.
     * @returns any No response body
     * @throws ApiError
     */
    public static voipQaSummaryRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/qa-summary/',
        });
    }
}
