/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Memo } from '../models/Memo';
import type { PaginatedMemoList } from '../models/PaginatedMemoList';
import type { PatchedMemo } from '../models/PatchedMemo';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MemosService {
    /**
     * CRUD for memos; includes archive and postpone actions.
     * @returns PaginatedMemoList
     * @throws ApiError
     */
    public static memosList({
        deal,
        draft,
        ordering,
        page,
        project,
        search,
        stage,
        task,
        to,
    }: {
        deal?: number,
        draft?: boolean,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        project?: number,
        /**
         * A search term.
         */
        search?: string,
        /**
         * * `pen` - pending
         * * `pos` - postponed
         * * `rev` - reviewed
         */
        stage?: 'pen' | 'pos' | 'rev',
        task?: number,
        to?: number,
    }): CancelablePromise<PaginatedMemoList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/memos/',
            query: {
                'deal': deal,
                'draft': draft,
                'ordering': ordering,
                'page': page,
                'project': project,
                'search': search,
                'stage': stage,
                'task': task,
                'to': to,
            },
        });
    }
    /**
     * CRUD for memos; includes archive and postpone actions.
     * @returns Memo
     * @throws ApiError
     */
    public static memosCreate({
        requestBody,
    }: {
        requestBody: Memo,
    }): CancelablePromise<Memo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/memos/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for memos; includes archive and postpone actions.
     * @returns Memo
     * @throws ApiError
     */
    public static memosRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Memo.
         */
        id: number,
    }): CancelablePromise<Memo> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/memos/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for memos; includes archive and postpone actions.
     * @returns Memo
     * @throws ApiError
     */
    public static memosUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Memo.
         */
        id: number,
        requestBody: Memo,
    }): CancelablePromise<Memo> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/memos/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for memos; includes archive and postpone actions.
     * @returns Memo
     * @throws ApiError
     */
    public static memosPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Memo.
         */
        id: number,
        requestBody?: PatchedMemo,
    }): CancelablePromise<Memo> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/memos/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for memos; includes archive and postpone actions.
     * @returns void
     * @throws ApiError
     */
    public static memosDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Memo.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/memos/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for memos; includes archive and postpone actions.
     * @returns Memo
     * @throws ApiError
     */
    public static memosmarkPostponedCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Memo.
         */
        id: number,
        requestBody: Memo,
    }): CancelablePromise<Memo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/memos/{id}/mark_postponed/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for memos; includes archive and postpone actions.
     * @returns Memo
     * @throws ApiError
     */
    public static memosmarkReviewedCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Memo.
         */
        id: number,
        requestBody: Memo,
    }): CancelablePromise<Memo> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/memos/{id}/mark_reviewed/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
