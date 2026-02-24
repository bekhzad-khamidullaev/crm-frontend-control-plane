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
    public static marketingcampaignsList({
        isActive,
        page,
        search,
        segment,
        template,
    }: {
        isActive?: boolean,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * A search term.
         */
        search?: string,
        segment?: number,
        template?: number,
    }): CancelablePromise<PaginatedCampaignList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/marketing/campaigns/',
            query: {
                'is_active': isActive,
                'page': page,
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
    public static marketingcampaignsCreate({
        requestBody,
    }: {
        requestBody: Campaign,
    }): CancelablePromise<Campaign> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/marketing/campaigns/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Campaign
     * @throws ApiError
     */
    public static marketingcampaignsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this campaign.
         */
        id: number,
    }): CancelablePromise<Campaign> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/marketing/campaigns/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Campaign
     * @throws ApiError
     */
    public static marketingcampaignsUpdate({
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
            url: '/marketing/campaigns/{id}/',
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
    public static marketingcampaignsPartialUpdate({
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
            url: '/marketing/campaigns/{id}/',
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
    public static marketingcampaignsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this campaign.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/marketing/campaigns/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedSegmentList
     * @throws ApiError
     */
    public static marketingsegmentsList({
        page,
        search,
    }: {
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedSegmentList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/marketing/segments/',
            query: {
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * @returns Segment
     * @throws ApiError
     */
    public static marketingsegmentsCreate({
        requestBody,
    }: {
        requestBody: Segment,
    }): CancelablePromise<Segment> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/marketing/segments/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Segment
     * @throws ApiError
     */
    public static marketingsegmentsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this segment.
         */
        id: number,
    }): CancelablePromise<Segment> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/marketing/segments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Segment
     * @throws ApiError
     */
    public static marketingsegmentsUpdate({
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
            url: '/marketing/segments/{id}/',
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
    public static marketingsegmentsPartialUpdate({
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
            url: '/marketing/segments/{id}/',
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
    public static marketingsegmentsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this segment.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/marketing/segments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedMessageTemplateList
     * @throws ApiError
     */
    public static marketingtemplatesList({
        channel,
        page,
        search,
    }: {
        /**
         * * `sms` - SMS
         * * `tg` - Telegram
         * * `ig` - Instagram
         * * `email` - Email
         */
        channel?: 'email' | 'ig' | 'sms' | 'tg',
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedMessageTemplateList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/marketing/templates/',
            query: {
                'channel': channel,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * @returns MessageTemplate
     * @throws ApiError
     */
    public static marketingtemplatesCreate({
        requestBody,
    }: {
        requestBody: MessageTemplate,
    }): CancelablePromise<MessageTemplate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/marketing/templates/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns MessageTemplate
     * @throws ApiError
     */
    public static marketingtemplatesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this message template.
         */
        id: number,
    }): CancelablePromise<MessageTemplate> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/marketing/templates/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns MessageTemplate
     * @throws ApiError
     */
    public static marketingtemplatesUpdate({
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
            url: '/marketing/templates/{id}/',
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
    public static marketingtemplatesPartialUpdate({
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
            url: '/marketing/templates/{id}/',
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
    public static marketingtemplatesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this message template.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/marketing/templates/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
