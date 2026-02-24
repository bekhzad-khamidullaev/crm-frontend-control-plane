/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Department } from '../models/Department';
import type { PaginatedDepartmentList } from '../models/PaginatedDepartmentList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DepartmentsService {
    /**
     * Read-only API for departments/groups
     * @returns PaginatedDepartmentList
     * @throws ApiError
     */
    public static departmentsList({
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
    }): CancelablePromise<PaginatedDepartmentList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/departments/',
            query: {
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * Read-only API for departments/groups
     * @returns Department
     * @throws ApiError
     */
    public static departmentsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Department.
         */
        id: number,
    }): CancelablePromise<Department> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/departments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get all members of a department
     * @returns Department
     * @throws ApiError
     */
    public static departmentsMembersRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Department.
         */
        id: number,
    }): CancelablePromise<Department> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/departments/{id}/members/',
            path: {
                'id': id,
            },
        });
    }
}
