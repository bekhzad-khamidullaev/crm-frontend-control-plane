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
    public static massmailEmailAccountsList({
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
            url: '/api/massmail/email-accounts/',
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
    public static massmailEmailAccountsCreate({
        requestBody,
    }: {
        requestBody: EmailAccount,
    }): CancelablePromise<EmailAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/massmail/email-accounts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns EmailAccount
     * @throws ApiError
     */
    public static massmailEmailAccountsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Email Account.
         */
        id: number,
    }): CancelablePromise<EmailAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/massmail/email-accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns EmailAccount
     * @throws ApiError
     */
    public static massmailEmailAccountsUpdate({
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
            url: '/api/massmail/email-accounts/{id}/',
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
    public static massmailEmailAccountsPartialUpdate({
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
            url: '/api/massmail/email-accounts/{id}/',
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
    public static massmailEmailAccountsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Email Account.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/massmail/email-accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedMailingOutList
     * @throws ApiError
     */
    public static massmailMailingsList({
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
            url: '/api/massmail/mailings/',
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
    public static massmailMailingsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Mailing Out.
         */
        id: number,
    }): CancelablePromise<MailingOut> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/massmail/mailings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedEmlMessageList
     * @throws ApiError
     */
    public static massmailMessagesList({
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
            url: '/api/massmail/messages/',
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
    public static massmailMessagesCreate({
        requestBody,
    }: {
        requestBody: EmlMessage,
    }): CancelablePromise<EmlMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/massmail/messages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns EmlMessage
     * @throws ApiError
     */
    public static massmailMessagesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Email Message.
         */
        id: number,
    }): CancelablePromise<EmlMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/massmail/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns EmlMessage
     * @throws ApiError
     */
    public static massmailMessagesUpdate({
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
            url: '/api/massmail/messages/{id}/',
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
    public static massmailMessagesPartialUpdate({
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
            url: '/api/massmail/messages/{id}/',
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
    public static massmailMessagesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Email Message.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/massmail/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedSignatureList
     * @throws ApiError
     */
    public static massmailSignaturesList({
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
            url: '/api/massmail/signatures/',
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
    public static massmailSignaturesCreate({
        requestBody,
    }: {
        requestBody: Signature,
    }): CancelablePromise<Signature> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/massmail/signatures/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Signature
     * @throws ApiError
     */
    public static massmailSignaturesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Signature.
         */
        id: number,
    }): CancelablePromise<Signature> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/massmail/signatures/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Signature
     * @throws ApiError
     */
    public static massmailSignaturesUpdate({
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
            url: '/api/massmail/signatures/{id}/',
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
    public static massmailSignaturesPartialUpdate({
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
            url: '/api/massmail/signatures/{id}/',
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
    public static massmailSignaturesDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Signature.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/massmail/signatures/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
