/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedTaskList } from '../models/PaginatedTaskList';
import type { PatchedTask } from '../models/PatchedTask';
import type { Task } from '../models/Task';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TasksService {
    /**
     * CRUD for tasks with filtering and ordering.
     * @returns PaginatedTaskList
     * @throws ApiError
     */
    public static tasksList({
        active,
        coOwner,
        ordering,
        owner,
        page,
        pageSize,
        project,
        search,
        stage,
    }: {
        active?: boolean,
        coOwner?: number,
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
        project?: number,
        /**
         * A search term.
         */
        search?: string,
        stage?: number,
    }): CancelablePromise<PaginatedTaskList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tasks/',
            query: {
                'active': active,
                'co_owner': coOwner,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'project': project,
                'search': search,
                'stage': stage,
            },
        });
    }
    /**
     * CRUD for tasks with filtering and ordering.
     * @returns Task
     * @throws ApiError
     */
    public static tasksCreate({
        requestBody,
    }: {
        requestBody: Task,
    }): CancelablePromise<Task> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/tasks/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for tasks with filtering and ordering.
     * @returns Task
     * @throws ApiError
     */
    public static tasksRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Task.
         */
        id: number,
    }): CancelablePromise<Task> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/tasks/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for tasks with filtering and ordering.
     * @returns Task
     * @throws ApiError
     */
    public static tasksUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Task.
         */
        id: number,
        requestBody: Task,
    }): CancelablePromise<Task> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/tasks/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for tasks with filtering and ordering.
     * @returns Task
     * @throws ApiError
     */
    public static tasksPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Task.
         */
        id: number,
        requestBody?: PatchedTask,
    }): CancelablePromise<Task> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/tasks/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for tasks with filtering and ordering.
     * @returns void
     * @throws ApiError
     */
    public static tasksDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Task.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/tasks/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
