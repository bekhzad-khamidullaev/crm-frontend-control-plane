/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChatMessage } from '../models/ChatMessage';
import type { PaginatedChatMessageList } from '../models/PaginatedChatMessageList';
import type { PatchedChatMessage } from '../models/PatchedChatMessage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ChatMessagesService {
    /**
     * Create, list, and manage internal chat messages.
     * @returns PaginatedChatMessageList
     * @throws ApiError
     */
    public static chatMessagesList({
        contentType,
        objectId,
        ordering,
        owner,
        page,
        pageSize,
        search,
    }: {
        contentType?: number,
        objectId?: number,
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
    }): CancelablePromise<PaginatedChatMessageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat-messages/',
            query: {
                'content_type': contentType,
                'object_id': objectId,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Create, list, and manage internal chat messages.
     * @returns ChatMessage
     * @throws ApiError
     */
    public static chatMessagesCreate({
        requestBody,
    }: {
        requestBody: ChatMessage,
    }): CancelablePromise<ChatMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat-messages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create, list, and manage internal chat messages.
     * @returns ChatMessage
     * @throws ApiError
     */
    public static chatMessagesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this message.
         */
        id: number,
    }): CancelablePromise<ChatMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat-messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Create, list, and manage internal chat messages.
     * @returns ChatMessage
     * @throws ApiError
     */
    public static chatMessagesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this message.
         */
        id: number,
        requestBody: ChatMessage,
    }): CancelablePromise<ChatMessage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/chat-messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create, list, and manage internal chat messages.
     * @returns ChatMessage
     * @throws ApiError
     */
    public static chatMessagesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this message.
         */
        id: number,
        requestBody?: PatchedChatMessage,
    }): CancelablePromise<ChatMessage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/chat-messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create, list, and manage internal chat messages.
     * @returns void
     * @throws ApiError
     */
    public static chatMessagesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this message.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/chat-messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Create, list, and manage internal chat messages.
     * @returns ChatMessage
     * @throws ApiError
     */
    public static chatMessagesRepliesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this message.
         */
        id: number,
    }): CancelablePromise<ChatMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat-messages/{id}/replies/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Create, list, and manage internal chat messages.
     * @returns ChatMessage
     * @throws ApiError
     */
    public static chatMessagesThreadRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this message.
         */
        id: number,
    }): CancelablePromise<ChatMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat-messages/{id}/thread/',
            path: {
                'id': id,
            },
        });
    }
}
