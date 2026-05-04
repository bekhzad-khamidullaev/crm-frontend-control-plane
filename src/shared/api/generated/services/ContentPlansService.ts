/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ContentAnalyticsResponse } from '../models/ContentAnalyticsResponse';
import type { ContentCalendarResponse } from '../models/ContentCalendarResponse';
import type { ContentChannelVariant } from '../models/ContentChannelVariant';
import type { ContentItem } from '../models/ContentItem';
import type { ContentPlan } from '../models/ContentPlan';
import type { PaginatedContentChannelVariantList } from '../models/PaginatedContentChannelVariantList';
import type { PaginatedContentItemList } from '../models/PaginatedContentItemList';
import type { PaginatedContentPlanList } from '../models/PaginatedContentPlanList';
import type { PatchedContentChannelVariant } from '../models/PatchedContentChannelVariant';
import type { PatchedContentItem } from '../models/PatchedContentItem';
import type { PatchedContentPlan } from '../models/PatchedContentPlan';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ContentPlansService {
    /**
     * @returns ContentAnalyticsResponse
     * @throws ApiError
     */
    public static contentPlanAnalyticsList(): CancelablePromise<Array<ContentAnalyticsResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/analytics/',
        });
    }
    /**
     * @returns ContentCalendarResponse
     * @throws ApiError
     */
    public static contentPlanCalendarList(): CancelablePromise<Array<ContentCalendarResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/calendar/',
        });
    }
    /**
     * @returns PaginatedContentItemList
     * @throws ApiError
     */
    public static contentPlanItemsList({
        assigneeApprover,
        assigneeCopy,
        assigneeDesign,
        page,
        pageSize,
        plan,
        search,
        workflowStage,
    }: {
        assigneeApprover?: number,
        assigneeCopy?: number,
        assigneeDesign?: number,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        plan?: number,
        /**
         * A search term.
         */
        search?: string,
        /**
         * * `idea` - Idea
         * * `copywriting` - Copywriting
         * * `design` - Design
         * * `review` - Review
         * * `approved` - Approved
         * * `scheduled` - Scheduled
         * * `published` - Published
         * * `failed` - Failed
         */
        workflowStage?: 'approved' | 'copywriting' | 'design' | 'failed' | 'idea' | 'published' | 'review' | 'scheduled',
    }): CancelablePromise<PaginatedContentItemList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/items/',
            query: {
                'assignee_approver': assigneeApprover,
                'assignee_copy': assigneeCopy,
                'assignee_design': assigneeDesign,
                'page': page,
                'page_size': pageSize,
                'plan': plan,
                'search': search,
                'workflow_stage': workflowStage,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsCreate({
        requestBody,
    }: {
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/items/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/items/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content-plan/items/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody?: PatchedContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/content-plan/items/{id}/',
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
    public static contentPlanItemsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content-plan/items/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsActivityRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/items/{id}/activity/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsApproveCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/items/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsEventsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/items/{id}/events/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsLinksRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/items/{id}/links/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsLinksCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/items/{id}/links/',
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
    public static contentPlanItemsLinksDestroy({
        id,
        linkId,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        linkId: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content-plan/items/{id}/links/{link_id}/',
            path: {
                'id': id,
                'link_id': linkId,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsPublishNowCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/items/{id}/publish_now/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsRejectCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/items/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsRequestApprovalCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/items/{id}/request_approval/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsRevisionsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/items/{id}/revisions/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsScheduleCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/items/{id}/schedule/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsTransitionCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/items/{id}/transition/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentPlanItemsBulkTransitionCreate({
        requestBody,
    }: {
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/items/bulk_transition/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedContentPlanList
     * @throws ApiError
     */
    public static contentPlanPlansList({
        campaign,
        owner,
        page,
        pageSize,
        search,
        status,
    }: {
        campaign?: number,
        owner?: number,
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
        /**
         * * `draft` - Draft
         * * `active` - Active
         * * `archived` - Archived
         */
        status?: 'active' | 'archived' | 'draft',
    }): CancelablePromise<PaginatedContentPlanList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/plans/',
            query: {
                'campaign': campaign,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'status': status,
            },
        });
    }
    /**
     * @returns ContentPlan
     * @throws ApiError
     */
    public static contentPlanPlansCreate({
        requestBody,
    }: {
        requestBody: ContentPlan,
    }): CancelablePromise<ContentPlan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/plans/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentPlan
     * @throws ApiError
     */
    public static contentPlanPlansRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content plan.
         */
        id: number,
    }): CancelablePromise<ContentPlan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content-plan/plans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentPlan
     * @throws ApiError
     */
    public static contentPlanPlansUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content plan.
         */
        id: number,
        requestBody: ContentPlan,
    }): CancelablePromise<ContentPlan> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content-plan/plans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentPlan
     * @throws ApiError
     */
    public static contentPlanPlansPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content plan.
         */
        id: number,
        requestBody?: PatchedContentPlan,
    }): CancelablePromise<ContentPlan> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/content-plan/plans/{id}/',
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
    public static contentPlanPlansDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this content plan.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content-plan/plans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentPlan
     * @throws ApiError
     */
    public static contentPlanPlansArchiveCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content plan.
         */
        id: number,
        requestBody: ContentPlan,
    }): CancelablePromise<ContentPlan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content-plan/plans/{id}/archive/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentAnalyticsResponse
     * @throws ApiError
     */
    public static contentAnalyticsList(): CancelablePromise<Array<ContentAnalyticsResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/analytics/',
        });
    }
    /**
     * @returns ContentCalendarResponse
     * @throws ApiError
     */
    public static contentCalendarList(): CancelablePromise<Array<ContentCalendarResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/calendar/',
        });
    }
    /**
     * @returns PaginatedContentChannelVariantList
     * @throws ApiError
     */
    public static contentChannelVariantsList({
        channel,
        item,
        page,
        pageSize,
        publishStatus,
    }: {
        /**
         * * `sms` - SMS
         * * `tg` - Telegram
         * * `ig` - Instagram
         * * `email` - Email
         */
        channel?: 'email' | 'ig' | 'sms' | 'tg',
        item?: number,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * * `draft` - Draft
         * * `queued` - Queued
         * * `sent` - Sent
         * * `error` - Error
         */
        publishStatus?: 'draft' | 'error' | 'queued' | 'sent',
    }): CancelablePromise<PaginatedContentChannelVariantList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/channel-variants/',
            query: {
                'channel': channel,
                'item': item,
                'page': page,
                'page_size': pageSize,
                'publish_status': publishStatus,
            },
        });
    }
    /**
     * @returns ContentChannelVariant
     * @throws ApiError
     */
    public static contentChannelVariantsCreate({
        requestBody,
    }: {
        requestBody: ContentChannelVariant,
    }): CancelablePromise<ContentChannelVariant> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/channel-variants/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentChannelVariant
     * @throws ApiError
     */
    public static contentChannelVariantsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content channel variant.
         */
        id: number,
    }): CancelablePromise<ContentChannelVariant> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/channel-variants/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentChannelVariant
     * @throws ApiError
     */
    public static contentChannelVariantsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content channel variant.
         */
        id: number,
        requestBody: ContentChannelVariant,
    }): CancelablePromise<ContentChannelVariant> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content/channel-variants/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentChannelVariant
     * @throws ApiError
     */
    public static contentChannelVariantsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content channel variant.
         */
        id: number,
        requestBody?: PatchedContentChannelVariant,
    }): CancelablePromise<ContentChannelVariant> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/content/channel-variants/{id}/',
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
    public static contentChannelVariantsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this content channel variant.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content/channel-variants/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedContentItemList
     * @throws ApiError
     */
    public static contentItemsList({
        assigneeApprover,
        assigneeCopy,
        assigneeDesign,
        page,
        pageSize,
        plan,
        search,
        workflowStage,
    }: {
        assigneeApprover?: number,
        assigneeCopy?: number,
        assigneeDesign?: number,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        plan?: number,
        /**
         * A search term.
         */
        search?: string,
        /**
         * * `idea` - Idea
         * * `copywriting` - Copywriting
         * * `design` - Design
         * * `review` - Review
         * * `approved` - Approved
         * * `scheduled` - Scheduled
         * * `published` - Published
         * * `failed` - Failed
         */
        workflowStage?: 'approved' | 'copywriting' | 'design' | 'failed' | 'idea' | 'published' | 'review' | 'scheduled',
    }): CancelablePromise<PaginatedContentItemList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/items/',
            query: {
                'assignee_approver': assigneeApprover,
                'assignee_copy': assigneeCopy,
                'assignee_design': assigneeDesign,
                'page': page,
                'page_size': pageSize,
                'plan': plan,
                'search': search,
                'workflow_stage': workflowStage,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsCreate({
        requestBody,
    }: {
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/items/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/items/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content/items/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody?: PatchedContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/content/items/{id}/',
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
    public static contentItemsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content/items/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsActivityRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/items/{id}/activity/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsApproveCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/items/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsEventsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/items/{id}/events/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsLinksRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/items/{id}/links/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsLinksCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/items/{id}/links/',
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
    public static contentItemsLinksDestroy({
        id,
        linkId,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        linkId: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content/items/{id}/links/{link_id}/',
            path: {
                'id': id,
                'link_id': linkId,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsPublishNowCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/items/{id}/publish_now/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsRejectCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/items/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsRequestApprovalCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/items/{id}/request_approval/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsRevisionsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/items/{id}/revisions/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsScheduleCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/items/{id}/schedule/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsTransitionCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content item.
         */
        id: number,
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/items/{id}/transition/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentItem
     * @throws ApiError
     */
    public static contentItemsBulkTransitionCreate({
        requestBody,
    }: {
        requestBody: ContentItem,
    }): CancelablePromise<ContentItem> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/items/bulk_transition/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedContentPlanList
     * @throws ApiError
     */
    public static contentPlansList({
        campaign,
        owner,
        page,
        pageSize,
        search,
        status,
    }: {
        campaign?: number,
        owner?: number,
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
        /**
         * * `draft` - Draft
         * * `active` - Active
         * * `archived` - Archived
         */
        status?: 'active' | 'archived' | 'draft',
    }): CancelablePromise<PaginatedContentPlanList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/plans/',
            query: {
                'campaign': campaign,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'status': status,
            },
        });
    }
    /**
     * @returns ContentPlan
     * @throws ApiError
     */
    public static contentPlansCreate({
        requestBody,
    }: {
        requestBody: ContentPlan,
    }): CancelablePromise<ContentPlan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/plans/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentPlan
     * @throws ApiError
     */
    public static contentPlansRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this content plan.
         */
        id: number,
    }): CancelablePromise<ContentPlan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/content/plans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentPlan
     * @throws ApiError
     */
    public static contentPlansUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content plan.
         */
        id: number,
        requestBody: ContentPlan,
    }): CancelablePromise<ContentPlan> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/content/plans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ContentPlan
     * @throws ApiError
     */
    public static contentPlansPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content plan.
         */
        id: number,
        requestBody?: PatchedContentPlan,
    }): CancelablePromise<ContentPlan> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/content/plans/{id}/',
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
    public static contentPlansDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this content plan.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/content/plans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ContentPlan
     * @throws ApiError
     */
    public static contentPlansArchiveCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this content plan.
         */
        id: number,
        requestBody: ContentPlan,
    }): CancelablePromise<ContentPlan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/content/plans/{id}/archive/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
