/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedProjectList } from '../models/PaginatedProjectList';
import type { PatchedProject } from '../models/PatchedProject';
import type { Project } from '../models/Project';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProjectsService {
    /**
     * CRUD for projects and related filtering.
     * @returns PaginatedProjectList
     * @throws ApiError
     */
    public static projectsList({
        active,
        coOwner,
        ordering,
        owner,
        page,
        pageSize,
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
        /**
         * A search term.
         */
        search?: string,
        stage?: number,
    }): CancelablePromise<PaginatedProjectList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects/',
            query: {
                'active': active,
                'co_owner': coOwner,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'stage': stage,
            },
        });
    }
    /**
     * CRUD for projects and related filtering.
     * @returns Project
     * @throws ApiError
     */
    public static projectsCreate({
        requestBody,
    }: {
        requestBody: Project,
    }): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/projects/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for projects and related filtering.
     * @returns Project
     * @throws ApiError
     */
    public static projectsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Project.
         */
        id: number,
    }): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for projects and related filtering.
     * @returns Project
     * @throws ApiError
     */
    public static projectsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Project.
         */
        id: number,
        requestBody: Project,
    }): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/projects/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for projects and related filtering.
     * @returns Project
     * @throws ApiError
     */
    public static projectsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Project.
         */
        id: number,
        requestBody?: PatchedProject,
    }): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/projects/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for projects and related filtering.
     * @returns void
     * @throws ApiError
     */
    public static projectsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Project.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/projects/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for projects and related filtering.
     * @returns Project
     * @throws ApiError
     */
    public static projectsAssignCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Project.
         */
        id: number,
        requestBody: Project,
    }): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/projects/{id}/assign/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for projects and related filtering.
     * @returns Project
     * @throws ApiError
     */
    public static projectsCompleteCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Project.
         */
        id: number,
        requestBody: Project,
    }): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/projects/{id}/complete/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for projects and related filtering.
     * @returns Project
     * @throws ApiError
     */
    public static projectsReopenCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Project.
         */
        id: number,
        requestBody: Project,
    }): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/projects/{id}/reopen/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for projects and related filtering.
     * @returns Project
     * @throws ApiError
     */
    public static projectsBulkTagCreate({
        requestBody,
    }: {
        requestBody: Project,
    }): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/projects/bulk_tag/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for projects and related filtering.
     * @returns Project
     * @throws ApiError
     */
    public static projectsExportRetrieve(): CancelablePromise<Project> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/projects/export/',
        });
    }
}
