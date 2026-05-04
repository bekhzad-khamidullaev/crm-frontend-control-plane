/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Campaign } from '../models/Campaign';
import type { MessageTemplate } from '../models/MessageTemplate';
import type { PaginatedCampaignList } from '../models/PaginatedCampaignList';
import type { PaginatedMessageTemplateList } from '../models/PaginatedMessageTemplateList';
import type { PaginatedSegmentList } from '../models/PaginatedSegmentList';
import type { PatchedCampaign } from '../models/PatchedCampaign';
import type { PatchedMessageTemplate } from '../models/PatchedMessageTemplate';
import type { PatchedSegment } from '../models/PatchedSegment';
import type { Segment } from '../models/Segment';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MarketingService {
    /**
     * @returns PaginatedCampaignList
     * @throws ApiError
     */
    public static marketingCampaignsList({
        isActive,
        owner,
        page,
        pageSize,
        search,
        segment,
        template,
    }: {
        isActive?: boolean,
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
        segment?: number,
        template?: number,
    }): CancelablePromise<PaginatedCampaignList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/marketing/campaigns/',
            query: {
                'is_active': isActive,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'segment': segment,
                'template': template,
            },
        });
    }
    /**
     * @returns Campaign
     * @throws ApiError
     */
    public static marketingCampaignsCreate({
        requestBody,
    }: {
        requestBody: Campaign,
    }): CancelablePromise<Campaign> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/marketing/campaigns/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Campaign
     * @throws ApiError
     */
    public static marketingCampaignsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this campaign.
         */
        id: number,
    }): CancelablePromise<Campaign> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/marketing/campaigns/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Campaign
     * @throws ApiError
     */
    public static marketingCampaignsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this campaign.
         */
        id: number,
        requestBody: Campaign,
    }): CancelablePromise<Campaign> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/marketing/campaigns/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Campaign
     * @throws ApiError
     */
    public static marketingCampaignsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this campaign.
         */
        id: number,
        requestBody?: PatchedCampaign,
    }): CancelablePromise<Campaign> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/marketing/campaigns/{id}/',
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
    public static marketingCampaignsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this campaign.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/marketing/campaigns/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedSegmentList
     * @throws ApiError
     */
    public static marketingSegmentsList({
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedSegmentList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/marketing/segments/',
            query: {
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns Segment
     * @throws ApiError
     */
    public static marketingSegmentsCreate({
        requestBody,
    }: {
        requestBody: Segment,
    }): CancelablePromise<Segment> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/marketing/segments/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Segment
     * @throws ApiError
     */
    public static marketingSegmentsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this segment.
         */
        id: number,
    }): CancelablePromise<Segment> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/marketing/segments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Segment
     * @throws ApiError
     */
    public static marketingSegmentsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this segment.
         */
        id: number,
        requestBody: Segment,
    }): CancelablePromise<Segment> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/marketing/segments/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Segment
     * @throws ApiError
     */
    public static marketingSegmentsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this segment.
         */
        id: number,
        requestBody?: PatchedSegment,
    }): CancelablePromise<Segment> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/marketing/segments/{id}/',
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
    public static marketingSegmentsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this segment.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/marketing/segments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedMessageTemplateList
     * @throws ApiError
     */
    public static marketingTemplatesList({
        channel,
        owner,
        page,
        pageSize,
        search,
    }: {
        /**
         * * `sms` - SMS
         * * `tg` - Telegram
         * * `ig` - Instagram
         * * `email` - Email
         */
        channel?: 'email' | 'ig' | 'sms' | 'tg',
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
    }): CancelablePromise<PaginatedMessageTemplateList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/marketing/templates/',
            query: {
                'channel': channel,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns MessageTemplate
     * @throws ApiError
     */
    public static marketingTemplatesCreate({
        requestBody,
    }: {
        requestBody: MessageTemplate,
    }): CancelablePromise<MessageTemplate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/marketing/templates/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns MessageTemplate
     * @throws ApiError
     */
    public static marketingTemplatesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this message template.
         */
        id: number,
    }): CancelablePromise<MessageTemplate> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/marketing/templates/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns MessageTemplate
     * @throws ApiError
     */
    public static marketingTemplatesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this message template.
         */
        id: number,
        requestBody: MessageTemplate,
    }): CancelablePromise<MessageTemplate> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/marketing/templates/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns MessageTemplate
     * @throws ApiError
     */
    public static marketingTemplatesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this message template.
         */
        id: number,
        requestBody?: PatchedMessageTemplate,
    }): CancelablePromise<MessageTemplate> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/marketing/templates/{id}/',
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
    public static marketingTemplatesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this message template.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/marketing/templates/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
