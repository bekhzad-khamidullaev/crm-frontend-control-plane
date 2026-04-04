/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CallRoutingRule } from '../models/CallRoutingRule';
import type { Connection } from '../models/Connection';
import type { IncomingCall } from '../models/IncomingCall';
import type { InternalNumberOption } from '../models/InternalNumberOption';
import type { NumberGroupOption } from '../models/NumberGroupOption';
import type { PaginatedCallRoutingRuleList } from '../models/PaginatedCallRoutingRuleList';
import type { PaginatedConnectionList } from '../models/PaginatedConnectionList';
import type { PaginatedIncomingCallList } from '../models/PaginatedIncomingCallList';
import type { PaginatedInternalNumberOptionList } from '../models/PaginatedInternalNumberOptionList';
import type { PaginatedNumberGroupOptionList } from '../models/PaginatedNumberGroupOptionList';
import type { PatchedCallRoutingRule } from '../models/PatchedCallRoutingRule';
import type { PatchedConnection } from '../models/PatchedConnection';
import type { PatchedInternalNumberOption } from '../models/PatchedInternalNumberOption';
import type { PatchedVoipRealtimeSettings } from '../models/PatchedVoipRealtimeSettings';
import type { PatchedVoipSystemSettings } from '../models/PatchedVoipSystemSettings';
import type { VoipRealtimeSettings } from '../models/VoipRealtimeSettings';
import type { VoipSystemSettings } from '../models/VoipSystemSettings';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VoIpService {
    /**
     * @returns PaginatedConnectionList
     * @throws ApiError
     */
    public static voipConnectionsList({
        active,
        page,
        pageSize,
        provider,
    }: {
        active?: boolean,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * Specify VoIP service provider
         *
         * * `Asterisk` - Asterisk
         */
        provider?: 'Asterisk',
    }): CancelablePromise<PaginatedConnectionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/connections/',
            query: {
                'active': active,
                'page': page,
                'page_size': pageSize,
                'provider': provider,
            },
        });
    }
    /**
     * @returns Connection
     * @throws ApiError
     */
    public static voipConnectionsCreate({
        requestBody,
    }: {
        requestBody: Connection,
    }): CancelablePromise<Connection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/connections/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Connection
     * @throws ApiError
     */
    public static voipConnectionsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this connection.
         */
        id: number,
    }): CancelablePromise<Connection> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/connections/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Connection
     * @throws ApiError
     */
    public static voipConnectionsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this connection.
         */
        id: number,
        requestBody: Connection,
    }): CancelablePromise<Connection> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/voip/connections/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Connection
     * @throws ApiError
     */
    public static voipConnectionsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this connection.
         */
        id: number,
        requestBody?: PatchedConnection,
    }): CancelablePromise<Connection> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/voip/connections/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static voipConnectionsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this connection.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/voip/connections/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Connection
     * @throws ApiError
     */
    public static voipConnectionsSwitchActiveCreate({
        requestBody,
    }: {
        requestBody: Connection,
    }): CancelablePromise<Connection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/connections/switch-active/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Connection
     * @throws ApiError
     */
    public static voipConnectionsTrunkHealthRetrieve(): CancelablePromise<Connection> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/connections/trunk-health/',
        });
    }
    /**
     * @returns PaginatedIncomingCallList
     * @throws ApiError
     */
    public static voipIncomingCallsList({
        clientType,
        isConsumed,
        page,
        pageSize,
        search,
        user,
    }: {
        clientType?: string,
        isConsumed?: boolean,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
        user?: number,
    }): CancelablePromise<PaginatedIncomingCallList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/incoming-calls/',
            query: {
                'client_type': clientType,
                'is_consumed': isConsumed,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'user': user,
            },
        });
    }
    /**
     * @returns IncomingCall
     * @throws ApiError
     */
    public static voipIncomingCallsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Incoming call.
         */
        id: number,
    }): CancelablePromise<IncomingCall> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/incoming-calls/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedInternalNumberOptionList
     * @throws ApiError
     */
    public static voipInternalNumbersList({
        active,
        page,
        pageSize,
        search,
        server,
    }: {
        active?: boolean,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
        server?: number,
    }): CancelablePromise<PaginatedInternalNumberOptionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/internal-numbers/',
            query: {
                'active': active,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'server': server,
            },
        });
    }
    /**
     * @returns InternalNumberOption
     * @throws ApiError
     */
    public static voipInternalNumbersCreate({
        requestBody,
    }: {
        requestBody: InternalNumberOption,
    }): CancelablePromise<InternalNumberOption> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/internal-numbers/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns InternalNumberOption
     * @throws ApiError
     */
    public static voipInternalNumbersRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Internal Number.
         */
        id: number,
    }): CancelablePromise<InternalNumberOption> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/internal-numbers/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns InternalNumberOption
     * @throws ApiError
     */
    public static voipInternalNumbersUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Internal Number.
         */
        id: number,
        requestBody: InternalNumberOption,
    }): CancelablePromise<InternalNumberOption> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/voip/internal-numbers/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns InternalNumberOption
     * @throws ApiError
     */
    public static voipInternalNumbersPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Internal Number.
         */
        id: number,
        requestBody?: PatchedInternalNumberOption,
    }): CancelablePromise<InternalNumberOption> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/voip/internal-numbers/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static voipInternalNumbersDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Internal Number.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/voip/internal-numbers/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns InternalNumberOption
     * @throws ApiError
     */
    public static voipInternalNumbersLifecycleRetrieve(): CancelablePromise<InternalNumberOption> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/internal-numbers/lifecycle/',
        });
    }
    /**
     * @returns InternalNumberOption
     * @throws ApiError
     */
    public static voipInternalNumbersSyncCreate({
        requestBody,
    }: {
        requestBody: InternalNumberOption,
    }): CancelablePromise<InternalNumberOption> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/internal-numbers/sync/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns InternalNumberOption
     * @throws ApiError
     */
    public static voipInternalNumbersValidateCreate({
        requestBody,
    }: {
        requestBody: InternalNumberOption,
    }): CancelablePromise<InternalNumberOption> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/internal-numbers/validate/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedNumberGroupOptionList
     * @throws ApiError
     */
    public static voipNumberGroupsList({
        active,
        distributionStrategy,
        page,
        pageSize,
        search,
        server,
    }: {
        active?: boolean,
        /**
         * How calls are distributed among group members
         *
         * * `round_robin` - Round Robin
         * * `random` - Random
         * * `priority` - Priority Order
         * * `all_ring` - Ring All
         * * `least_recent` - Least Recently Called
         */
        distributionStrategy?: 'all_ring' | 'least_recent' | 'priority' | 'random' | 'round_robin',
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
        server?: number,
    }): CancelablePromise<PaginatedNumberGroupOptionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/number-groups/',
            query: {
                'active': active,
                'distribution_strategy': distributionStrategy,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'server': server,
            },
        });
    }
    /**
     * @returns NumberGroupOption
     * @throws ApiError
     */
    public static voipNumberGroupsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Number Group.
         */
        id: number,
    }): CancelablePromise<NumberGroupOption> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/number-groups/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns VoipRealtimeSettings
     * @throws ApiError
     */
    public static voipRealtimeSettingsList(): CancelablePromise<Array<VoipRealtimeSettings>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/realtime-settings/',
        });
    }
    /**
     * @returns VoipRealtimeSettings
     * @throws ApiError
     */
    public static voipRealtimeSettingsCurrentRetrieve(): CancelablePromise<VoipRealtimeSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/realtime-settings/current/',
        });
    }
    /**
     * @returns VoipRealtimeSettings
     * @throws ApiError
     */
    public static voipRealtimeSettingsCurrentPartialUpdate({
        requestBody,
    }: {
        requestBody?: PatchedVoipRealtimeSettings,
    }): CancelablePromise<VoipRealtimeSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/voip/realtime-settings/current/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns VoipRealtimeSettings
     * @throws ApiError
     */
    public static voipRealtimeSettingsTestCreate({
        requestBody,
    }: {
        requestBody?: VoipRealtimeSettings,
    }): CancelablePromise<VoipRealtimeSettings> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/realtime-settings/test/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedCallRoutingRuleList
     * @throws ApiError
     */
    public static voipRoutingRulesList({
        action,
        active,
        ordering,
        page,
        pageSize,
        search,
        targetGroup,
        targetNumber,
    }: {
        /**
         * * `route_to_number` - Route to Number
         * * `route_to_group` - Route to Group
         * * `route_to_queue` - Route to Queue
         * * `route_to_voicemail` - Route to Voicemail
         * * `play_announcement` - Play Announcement
         * * `hangup` - Hangup
         * * `forward_external` - Forward to External Number
         */
        action?: 'forward_external' | 'hangup' | 'play_announcement' | 'route_to_group' | 'route_to_number' | 'route_to_queue' | 'route_to_voicemail',
        active?: boolean,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
        targetGroup?: number,
        targetNumber?: number,
    }): CancelablePromise<PaginatedCallRoutingRuleList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/routing-rules/',
            query: {
                'action': action,
                'active': active,
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'target_group': targetGroup,
                'target_number': targetNumber,
            },
        });
    }
    /**
     * @returns CallRoutingRule
     * @throws ApiError
     */
    public static voipRoutingRulesCreate({
        requestBody,
    }: {
        requestBody: CallRoutingRule,
    }): CancelablePromise<CallRoutingRule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/routing-rules/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns CallRoutingRule
     * @throws ApiError
     */
    public static voipRoutingRulesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Call Routing Rule.
         */
        id: number,
    }): CancelablePromise<CallRoutingRule> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/routing-rules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns CallRoutingRule
     * @throws ApiError
     */
    public static voipRoutingRulesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Call Routing Rule.
         */
        id: number,
        requestBody: CallRoutingRule,
    }): CancelablePromise<CallRoutingRule> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/voip/routing-rules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns CallRoutingRule
     * @throws ApiError
     */
    public static voipRoutingRulesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Call Routing Rule.
         */
        id: number,
        requestBody?: PatchedCallRoutingRule,
    }): CancelablePromise<CallRoutingRule> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/voip/routing-rules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static voipRoutingRulesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Call Routing Rule.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/voip/routing-rules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns VoipSystemSettings
     * @throws ApiError
     */
    public static voipSystemSettingsList(): CancelablePromise<Array<VoipSystemSettings>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/system-settings/',
        });
    }
    /**
     * @returns VoipSystemSettings
     * @throws ApiError
     */
    public static voipSystemSettingsRetrieve({
        id,
    }: {
        id: string,
    }): CancelablePromise<VoipSystemSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/system-settings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns VoipSystemSettings
     * @throws ApiError
     */
    public static voipSystemSettingsPartialUpdate({
        id,
        requestBody,
    }: {
        id: string,
        requestBody?: PatchedVoipSystemSettings,
    }): CancelablePromise<VoipSystemSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/voip/system-settings/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns VoipSystemSettings
     * @throws ApiError
     */
    public static voipSystemSettingsCurrentRetrieve(): CancelablePromise<VoipSystemSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/system-settings/current/',
        });
    }
    /**
     * @returns VoipSystemSettings
     * @throws ApiError
     */
    public static voipSystemSettingsCurrentPartialUpdate({
        requestBody,
    }: {
        requestBody?: PatchedVoipSystemSettings,
    }): CancelablePromise<VoipSystemSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/voip/system-settings/current/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns VoipSystemSettings
     * @throws ApiError
     */
    public static voipSystemSettingsHealthRetrieve(): CancelablePromise<VoipSystemSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/voip/system-settings/health/',
        });
    }
    /**
     * @returns VoipSystemSettings
     * @throws ApiError
     */
    public static voipSystemSettingsReconcileCreate({
        requestBody,
    }: {
        requestBody?: VoipSystemSettings,
    }): CancelablePromise<VoipSystemSettings> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/voip/system-settings/reconcile/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
