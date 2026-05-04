/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Meeting } from '../models/Meeting';
import type { PaginatedMeetingList } from '../models/PaginatedMeetingList';
import type { PatchedMeeting } from '../models/PatchedMeeting';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MeetingsService {
    /**
     * CRUD API for meeting records.
     * @returns PaginatedMeetingList
     * @throws ApiError
     */
    public static meetingsList({
        company,
        contact,
        deal,
        format,
        ordering,
        owner,
        page,
        pageSize,
        search,
        status,
    }: {
        company?: number,
        contact?: number,
        deal?: number,
        /**
         * * `offline` - Offline
         * * `online` - Online
         * * `call` - Call
         */
        format?: 'call' | 'offline' | 'online',
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
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
         * * `scheduled` - Scheduled
         * * `completed` - Completed
         * * `cancelled` - Cancelled
         */
        status?: 'cancelled' | 'completed' | 'scheduled',
    }): CancelablePromise<PaginatedMeetingList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/meetings/',
            query: {
                'company': company,
                'contact': contact,
                'deal': deal,
                'format': format,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'status': status,
            },
        });
    }
    /**
     * CRUD API for meeting records.
     * @returns Meeting
     * @throws ApiError
     */
    public static meetingsCreate({
        requestBody,
    }: {
        requestBody: Meeting,
    }): CancelablePromise<Meeting> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/meetings/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for meeting records.
     * @returns Meeting
     * @throws ApiError
     */
    public static meetingsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Meeting.
         */
        id: number,
    }): CancelablePromise<Meeting> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/meetings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD API for meeting records.
     * @returns Meeting
     * @throws ApiError
     */
    public static meetingsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Meeting.
         */
        id: number,
        requestBody: Meeting,
    }): CancelablePromise<Meeting> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/meetings/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for meeting records.
     * @returns Meeting
     * @throws ApiError
     */
    public static meetingsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Meeting.
         */
        id: number,
        requestBody?: PatchedMeeting,
    }): CancelablePromise<Meeting> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/meetings/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for meeting records.
     * @returns void
     * @throws ApiError
     */
    public static meetingsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Meeting.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/meetings/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
