/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailAccount } from '../models/EmailAccount';
import type { EmlMessage } from '../models/EmlMessage';
import type { MailingOut } from '../models/MailingOut';
import type { PaginatedEmailAccountList } from '../models/PaginatedEmailAccountList';
import type { PaginatedEmlMessageList } from '../models/PaginatedEmlMessageList';
import type { PaginatedMailingOutList } from '../models/PaginatedMailingOutList';
import type { PaginatedSignatureList } from '../models/PaginatedSignatureList';
import type { PatchedEmailAccount } from '../models/PatchedEmailAccount';
import type { PatchedEmlMessage } from '../models/PatchedEmlMessage';
import type { PatchedSignature } from '../models/PatchedSignature';
import type { Signature } from '../models/Signature';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MassmailService {
    /**
     * @returns PaginatedEmailAccountList
     * @throws ApiError
     */
    public static massmailemailAccountsList({
        doImport,
        main,
        massmail,
        owner,
        page,
        search,
    }: {
        doImport?: boolean,
        main?: boolean,
        massmail?: boolean,
        owner?: number,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedEmailAccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/massmail/email-accounts/',
            query: {
                'do_import': doImport,
                'main': main,
                'massmail': massmail,
                'owner': owner,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * @returns EmailAccount
     * @throws ApiError
     */
    public static massmailemailAccountsCreate({
        requestBody,
    }: {
        requestBody: EmailAccount,
    }): CancelablePromise<EmailAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/massmail/email-accounts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns EmailAccount
     * @throws ApiError
     */
    public static massmailemailAccountsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Email Account.
         */
        id: number,
    }): CancelablePromise<EmailAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/massmail/email-accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns EmailAccount
     * @throws ApiError
     */
    public static massmailemailAccountsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Email Account.
         */
        id: number,
        requestBody: EmailAccount,
    }): CancelablePromise<EmailAccount> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/massmail/email-accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns EmailAccount
     * @throws ApiError
     */
    public static massmailemailAccountsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Email Account.
         */
        id: number,
        requestBody?: PatchedEmailAccount,
    }): CancelablePromise<EmailAccount> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/massmail/email-accounts/{id}/',
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
    public static massmailemailAccountsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Email Account.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/massmail/email-accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedMailingOutList
     * @throws ApiError
     */
    public static massmailmailingsList({
        owner,
        page,
        status,
    }: {
        owner?: number,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * * `A` - Active
         * * `E` - Active but Error
         * * `P` - Paused
         * * `I` - Interrupted
         * * `D` - Done
         */
        status?: 'A' | 'D' | 'E' | 'I' | 'P',
    }): CancelablePromise<PaginatedMailingOutList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/massmail/mailings/',
            query: {
                'owner': owner,
                'page': page,
                'status': status,
            },
        });
    }
    /**
     * @returns MailingOut
     * @throws ApiError
     */
    public static massmailmailingsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Mailing Out.
         */
        id: number,
    }): CancelablePromise<MailingOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/massmail/mailings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedEmlMessageList
     * @throws ApiError
     */
    public static massmailmessagesList({
        owner,
        page,
        search,
    }: {
        owner?: number,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedEmlMessageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/massmail/messages/',
            query: {
                'owner': owner,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * @returns EmlMessage
     * @throws ApiError
     */
    public static massmailmessagesCreate({
        requestBody,
    }: {
        requestBody: EmlMessage,
    }): CancelablePromise<EmlMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/massmail/messages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns EmlMessage
     * @throws ApiError
     */
    public static massmailmessagesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Email Message.
         */
        id: number,
    }): CancelablePromise<EmlMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/massmail/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns EmlMessage
     * @throws ApiError
     */
    public static massmailmessagesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Email Message.
         */
        id: number,
        requestBody: EmlMessage,
    }): CancelablePromise<EmlMessage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/massmail/messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns EmlMessage
     * @throws ApiError
     */
    public static massmailmessagesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Email Message.
         */
        id: number,
        requestBody?: PatchedEmlMessage,
    }): CancelablePromise<EmlMessage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/massmail/messages/{id}/',
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
    public static massmailmessagesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Email Message.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/massmail/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedSignatureList
     * @throws ApiError
     */
    public static massmailsignaturesList({
        ordering,
        page,
        search,
    }: {
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedSignatureList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/massmail/signatures/',
            query: {
                'ordering': ordering,
                'page': page,
                'search': search,
            },
        });
    }
    /**
     * @returns Signature
     * @throws ApiError
     */
    public static massmailsignaturesCreate({
        requestBody,
    }: {
        requestBody: Signature,
    }): CancelablePromise<Signature> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/massmail/signatures/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Signature
     * @throws ApiError
     */
    public static massmailsignaturesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Signature.
         */
        id: number,
    }): CancelablePromise<Signature> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/massmail/signatures/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Signature
     * @throws ApiError
     */
    public static massmailsignaturesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Signature.
         */
        id: number,
        requestBody: Signature,
    }): CancelablePromise<Signature> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/massmail/signatures/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Signature
     * @throws ApiError
     */
    public static massmailsignaturesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Signature.
         */
        id: number,
        requestBody?: PatchedSignature,
    }): CancelablePromise<Signature> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/massmail/signatures/{id}/',
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
    public static massmailsignaturesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Signature.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/massmail/signatures/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
