/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GlobalNotificationSettings } from '../models/GlobalNotificationSettings';
import type { Notification } from '../models/Notification';
import type { NotificationIngest } from '../models/NotificationIngest';
import type { NotificationIngestResponse } from '../models/NotificationIngestResponse';
import type { NotificationObservabilitySummary } from '../models/NotificationObservabilitySummary';
import type { PaginatedNotificationList } from '../models/PaginatedNotificationList';
import type { PatchedGlobalNotificationSettings } from '../models/PatchedGlobalNotificationSettings';
import type { PatchedUserNotificationSettings } from '../models/PatchedUserNotificationSettings';
import type { UserNotificationSettings } from '../models/UserNotificationSettings';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NotificationsService {
    /**
     * @returns NotificationIngestResponse
     * @throws ApiError
     */
    public static notificationsEventsCreate({
        requestBody,
    }: {
        requestBody: NotificationIngest,
    }): CancelablePromise<NotificationIngestResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notifications/events/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedNotificationList
     * @throws ApiError
     */
    public static notificationsInboxList({
        cursor,
        ordering,
        search,
    }: {
        /**
         * The pagination cursor value.
         */
        cursor?: string,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedNotificationList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/notifications/inbox/',
            query: {
                'cursor': cursor,
                'ordering': ordering,
                'search': search,
            },
        });
    }
    /**
     * @returns Notification
     * @throws ApiError
     */
    public static notificationsInboxArchiveCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this notification.
         */
        id: number,
        requestBody?: Notification,
    }): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notifications/inbox/{id}/archive/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Notification
     * @throws ApiError
     */
    public static notificationsInboxReadCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this notification.
         */
        id: number,
        requestBody?: Notification,
    }): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notifications/inbox/{id}/read/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Notification
     * @throws ApiError
     */
    public static notificationsInboxStatusCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this notification.
         */
        id: number,
        requestBody?: Notification,
    }): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notifications/inbox/{id}/status/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Notification
     * @throws ApiError
     */
    public static notificationsInboxArchiveAllCreate({
        requestBody,
    }: {
        requestBody?: Notification,
    }): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notifications/inbox/archive-all/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Notification
     * @throws ApiError
     */
    public static notificationsInboxMarkAllReadCreate({
        requestBody,
    }: {
        requestBody?: Notification,
    }): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/notifications/inbox/mark-all-read/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns NotificationObservabilitySummary
     * @throws ApiError
     */
    public static notificationsObservabilitySummaryRetrieve(): CancelablePromise<NotificationObservabilitySummary> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/notifications/observability/summary/',
        });
    }
    /**
     * @returns GlobalNotificationSettings
     * @throws ApiError
     */
    public static notificationsPreferencesGlobalRetrieve(): CancelablePromise<GlobalNotificationSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/notifications/preferences/global/',
        });
    }
    /**
     * @returns GlobalNotificationSettings
     * @throws ApiError
     */
    public static notificationsPreferencesGlobalPartialUpdate({
        requestBody,
    }: {
        requestBody?: PatchedGlobalNotificationSettings,
    }): CancelablePromise<GlobalNotificationSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/notifications/preferences/global/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns UserNotificationSettings
     * @throws ApiError
     */
    public static notificationsPreferencesMeRetrieve(): CancelablePromise<UserNotificationSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/notifications/preferences/me/',
        });
    }
    /**
     * @returns UserNotificationSettings
     * @throws ApiError
     */
    public static notificationsPreferencesMePartialUpdate({
        requestBody,
    }: {
        requestBody?: PatchedUserNotificationSettings,
    }): CancelablePromise<UserNotificationSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/notifications/preferences/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
