/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedReminderList } from '../models/PaginatedReminderList';
import type { PatchedReminder } from '../models/PatchedReminder';
import type { Reminder } from '../models/Reminder';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RemindersService {
    /**
     * CRUD API for reminders
     * @returns PaginatedReminderList
     * @throws ApiError
     */
    public static remindersList({
        active,
        contentType,
        ordering,
        owner,
        page,
        pageSize,
        search,
    }: {
        active?: boolean,
        contentType?: number,
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
    }): CancelablePromise<PaginatedReminderList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reminders/',
            query: {
                'active': active,
                'content_type': contentType,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * CRUD API for reminders
     * @returns Reminder
     * @throws ApiError
     */
    public static remindersCreate({
        requestBody,
    }: {
        requestBody: Reminder,
    }): CancelablePromise<Reminder> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reminders/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for reminders
     * @returns Reminder
     * @throws ApiError
     */
    public static remindersRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Reminder.
         */
        id: number,
    }): CancelablePromise<Reminder> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reminders/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD API for reminders
     * @returns Reminder
     * @throws ApiError
     */
    public static remindersUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Reminder.
         */
        id: number,
        requestBody: Reminder,
    }): CancelablePromise<Reminder> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/reminders/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for reminders
     * @returns Reminder
     * @throws ApiError
     */
    public static remindersPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Reminder.
         */
        id: number,
        requestBody?: PatchedReminder,
    }): CancelablePromise<Reminder> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/reminders/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for reminders
     * @returns void
     * @throws ApiError
     */
    public static remindersDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Reminder.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/reminders/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get upcoming active reminders (next 7 days)
     * @returns Reminder
     * @throws ApiError
     */
    public static remindersUpcomingRetrieve(): CancelablePromise<Reminder> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reminders/upcoming/',
        });
    }
}
