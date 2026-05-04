/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentChannel } from '../models/ContentChannel';
import type { ContentTemplate } from '../models/ContentTemplate';
import type { ContentWorkflowStatus } from '../models/ContentWorkflowStatus';
import type { ContentWorkspace } from '../models/ContentWorkspace';
import type { IntegrationConnection } from '../models/IntegrationConnection';
import type { IntegrationSyncJob } from '../models/IntegrationSyncJob';
import type { PaginatedContentChannelList } from '../models/PaginatedContentChannelList';
import type { PaginatedContentTemplateList } from '../models/PaginatedContentTemplateList';
import type { PaginatedContentWorkflowStatusList } from '../models/PaginatedContentWorkflowStatusList';
import type { PaginatedContentWorkspaceList } from '../models/PaginatedContentWorkspaceList';
import type { PaginatedIntegrationConnectionList } from '../models/PaginatedIntegrationConnectionList';
import type { PaginatedIntegrationSyncJobList } from '../models/PaginatedIntegrationSyncJobList';
import type { PatchedContentChannel } from '../models/PatchedContentChannel';
import type { PatchedContentTemplate } from '../models/PatchedContentTemplate';
import type { PatchedContentWorkflowStatus } from '../models/PatchedContentWorkflowStatus';
import type { PatchedContentWorkspace } from '../models/PatchedContentWorkspace';
import type { PatchedIntegrationConnection } from '../models/PatchedIntegrationConnection';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ContentPlanService {
    /**
     * @returns PaginatedContentChannelList
     * @throws ApiError
     */
    public static contentPlanChannelsList({
        ordering,
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedContentChannelList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/channels/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns ContentChannel
     * @throws ApiError
     */
    public static contentPlanChannelsCreate({
        requestBody,
    }: {
        requestBody: ContentChannel,
    }): CancelablePromise<ContentChannel> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/channels/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentChannel
     * @throws ApiError
     */
    public static contentPlanChannelsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content channel.
         */
        id: number,
    }): CancelablePromise<ContentChannel> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/channels/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentChannel
     * @throws ApiError
     */
    public static contentPlanChannelsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content channel.
         */
        id: number,
        requestBody: ContentChannel,
    }): CancelablePromise<ContentChannel> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content-plan/channels/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentChannel
     * @throws ApiError
     */
    public static contentPlanChannelsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content channel.
         */
        id: number,
        requestBody?: PatchedContentChannel,
    }): CancelablePromise<ContentChannel> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/content-plan/channels/{id}/',
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
    public static contentPlanChannelsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this content channel.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content-plan/channels/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedIntegrationConnectionList
     * @throws ApiError
     */
    public static contentPlanIntegrationsList({
        ordering,
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedIntegrationConnectionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/integrations/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsCreate({
        requestBody,
    }: {
        requestBody: IntegrationConnection,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/integrations/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this integration connection.
         */
        id: number,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/integrations/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this integration connection.
         */
        id: number,
        requestBody: IntegrationConnection,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content-plan/integrations/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this integration connection.
         */
        id: number,
        requestBody?: PatchedIntegrationConnection,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/content-plan/integrations/{id}/',
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
    public static contentPlanIntegrationsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this integration connection.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content-plan/integrations/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsSyncPullCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this integration connection.
         */
        id: number,
        requestBody: IntegrationConnection,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/integrations/{id}/sync/pull/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsSyncPushCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this integration connection.
         */
        id: number,
        requestBody: IntegrationConnection,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/integrations/{id}/sync/push/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsWebhookCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this integration connection.
         */
        id: number,
        requestBody: IntegrationConnection,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/integrations/{id}/webhook/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsConnectByProviderCreate({
        provider,
        requestBody,
    }: {
        provider: string,
        requestBody: IntegrationConnection,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/integrations/{provider}/connect/',
            path: {
                'provider': provider,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsSyncPullByProviderCreate({
        provider,
        requestBody,
    }: {
        provider: string,
        requestBody: IntegrationConnection,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/integrations/{provider}/sync/pull/',
            path: {
                'provider': provider,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsSyncPushByProviderCreate({
        provider,
        requestBody,
    }: {
        provider: string,
        requestBody: IntegrationConnection,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/integrations/{provider}/sync/push/',
            path: {
                'provider': provider,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns IntegrationConnection
     * @throws ApiError
     */
    public static contentPlanIntegrationsWebhookByProviderCreate({
        provider,
        requestBody,
    }: {
        provider: string,
        requestBody: IntegrationConnection,
    }): CancelablePromise<IntegrationConnection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/integrations/{provider}/webhook/',
            path: {
                'provider': provider,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedIntegrationSyncJobList
     * @throws ApiError
     */
    public static contentPlanSyncJobsList({
        ordering,
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedIntegrationSyncJobList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/sync-jobs/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns IntegrationSyncJob
     * @throws ApiError
     */
    public static contentPlanSyncJobsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this integration sync job.
         */
        id: number,
    }): CancelablePromise<IntegrationSyncJob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/sync-jobs/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns IntegrationSyncJob
     * @throws ApiError
     */
    public static contentPlanSyncJobsRetryCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this integration sync job.
         */
        id: number,
        requestBody: IntegrationSyncJob,
    }): CancelablePromise<IntegrationSyncJob> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/sync-jobs/{id}/retry/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedContentTemplateList
     * @throws ApiError
     */
    public static contentPlanTemplatesList({
        ordering,
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedContentTemplateList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/templates/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns ContentTemplate
     * @throws ApiError
     */
    public static contentPlanTemplatesCreate({
        requestBody,
    }: {
        requestBody: ContentTemplate,
    }): CancelablePromise<ContentTemplate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/templates/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentTemplate
     * @throws ApiError
     */
    public static contentPlanTemplatesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content template.
         */
        id: number,
    }): CancelablePromise<ContentTemplate> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/templates/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentTemplate
     * @throws ApiError
     */
    public static contentPlanTemplatesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content template.
         */
        id: number,
        requestBody: ContentTemplate,
    }): CancelablePromise<ContentTemplate> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content-plan/templates/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentTemplate
     * @throws ApiError
     */
    public static contentPlanTemplatesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content template.
         */
        id: number,
        requestBody?: PatchedContentTemplate,
    }): CancelablePromise<ContentTemplate> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/content-plan/templates/{id}/',
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
    public static contentPlanTemplatesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this content template.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content-plan/templates/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedContentWorkflowStatusList
     * @throws ApiError
     */
    public static contentPlanWorkflowStatusesList({
        ordering,
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedContentWorkflowStatusList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workflow-statuses/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns ContentWorkflowStatus
     * @throws ApiError
     */
    public static contentPlanWorkflowStatusesCreate({
        requestBody,
    }: {
        requestBody: ContentWorkflowStatus,
    }): CancelablePromise<ContentWorkflowStatus> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/workflow-statuses/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentWorkflowStatus
     * @throws ApiError
     */
    public static contentPlanWorkflowStatusesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content workflow status.
         */
        id: number,
    }): CancelablePromise<ContentWorkflowStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workflow-statuses/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentWorkflowStatus
     * @throws ApiError
     */
    public static contentPlanWorkflowStatusesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content workflow status.
         */
        id: number,
        requestBody: ContentWorkflowStatus,
    }): CancelablePromise<ContentWorkflowStatus> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content-plan/workflow-statuses/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentWorkflowStatus
     * @throws ApiError
     */
    public static contentPlanWorkflowStatusesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content workflow status.
         */
        id: number,
        requestBody?: PatchedContentWorkflowStatus,
    }): CancelablePromise<ContentWorkflowStatus> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/content-plan/workflow-statuses/{id}/',
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
    public static contentPlanWorkflowStatusesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this content workflow status.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content-plan/workflow-statuses/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedContentWorkspaceList
     * @throws ApiError
     */
    public static contentPlanWorkspacesList({
        ordering,
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedContentWorkspaceList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workspaces/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesCreate({
        requestBody,
    }: {
        requestBody: ContentWorkspace,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/workspaces/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workspaces/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
        requestBody: ContentWorkspace,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content-plan/workspaces/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
        requestBody?: PatchedContentWorkspace,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/content-plan/workspaces/{id}/',
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
    public static contentPlanWorkspacesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content-plan/workspaces/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesAnalyticsChannelsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workspaces/{id}/analytics/channels/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesAnalyticsPlanFactRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workspaces/{id}/analytics/plan-fact/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesAnalyticsSlaRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workspaces/{id}/analytics/sla/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesChannelsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workspaces/{id}/channels/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesChannelsCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
        requestBody: ContentWorkspace,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/workspaces/{id}/channels/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesSettingsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workspaces/{id}/settings/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesSettingsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
        requestBody: ContentWorkspace,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content-plan/workspaces/{id}/settings/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesSlaCheckCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
        requestBody: ContentWorkspace,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/workspaces/{id}/sla/check/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesTemplatesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workspaces/{id}/templates/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesTemplatesCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
        requestBody: ContentWorkspace,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/workspaces/{id}/templates/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesWorkflowStatusesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/workspaces/{id}/workflow-statuses/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentWorkspace
     * @throws ApiError
     */
    public static contentPlanWorkspacesWorkflowStatusesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content workspace.
         */
        id: number,
        requestBody: ContentWorkspace,
    }): CancelablePromise<ContentWorkspace> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content-plan/workspaces/{id}/workflow-statuses/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
