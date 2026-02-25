/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Contact } from '../models/Contact';
import type { PaginatedContactList } from '../models/PaginatedContactList';
import type { PatchedContact } from '../models/PatchedContact';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ContactsService {
    /**
     * CRUD for contacts with search and filters.
     * @returns PaginatedContactList
     * @throws ApiError
     */
    public static contactsList({
        company,
        country,
        department,
        disqualified,
        ordering,
        owner,
        page,
        pageSize,
        search,
    }: {
        company?: number,
        country?: number,
        department?: number,
        disqualified?: boolean,
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
    }): CancelablePromise<PaginatedContactList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contacts/',
            query: {
                'company': company,
                'country': country,
                'department': department,
                'disqualified': disqualified,
                'ordering': ordering,
                'owner': owner,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * CRUD for contacts with search and filters.
     * @returns Contact
     * @throws ApiError
     */
    public static contactsCreate({
        requestBody,
    }: {
        requestBody: Contact,
    }): CancelablePromise<Contact> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/contacts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for contacts with search and filters.
     * @returns Contact
     * @throws ApiError
     */
    public static contactsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Contact person.
         */
        id: number,
    }): CancelablePromise<Contact> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/contacts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for contacts with search and filters.
     * @returns Contact
     * @throws ApiError
     */
    public static contactsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Contact person.
         */
        id: number,
        requestBody: Contact,
    }): CancelablePromise<Contact> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/contacts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for contacts with search and filters.
     * @returns Contact
     * @throws ApiError
     */
    public static contactsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Contact person.
         */
        id: number,
        requestBody?: PatchedContact,
    }): CancelablePromise<Contact> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/contacts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for contacts with search and filters.
     * @returns void
     * @throws ApiError
     */
    public static contactsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Contact person.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/contacts/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
