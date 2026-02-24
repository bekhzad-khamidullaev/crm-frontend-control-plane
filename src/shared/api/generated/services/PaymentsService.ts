/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedPaymentList } from '../models/PaginatedPaymentList';
import type { PatchedPayment } from '../models/PatchedPayment';
import type { Payment } from '../models/Payment';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PaymentsService {
    /**
     * CRUD API for payments
     * @returns PaginatedPaymentList
     * @throws ApiError
     */
    public static paymentsList({
        currency,
        deal,
        ordering,
        page,
        search,
        status,
    }: {
        currency?: number,
        deal?: number,
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
        /**
         * * `r` - received
         * * `g` - guaranteed
         * * `h` - high probability
         * * `l` - low probability
         */
        status?: 'g' | 'h' | 'l' | 'r',
    }): CancelablePromise<PaginatedPaymentList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/payments/',
            query: {
                'currency': currency,
                'deal': deal,
                'ordering': ordering,
                'page': page,
                'search': search,
                'status': status,
            },
        });
    }
    /**
     * CRUD API for payments
     * @returns Payment
     * @throws ApiError
     */
    public static paymentsCreate({
        requestBody,
    }: {
        requestBody: Payment,
    }): CancelablePromise<Payment> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/payments/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for payments
     * @returns Payment
     * @throws ApiError
     */
    public static paymentsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Payment.
         */
        id: number,
    }): CancelablePromise<Payment> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/payments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD API for payments
     * @returns Payment
     * @throws ApiError
     */
    public static paymentsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Payment.
         */
        id: number,
        requestBody: Payment,
    }): CancelablePromise<Payment> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/payments/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for payments
     * @returns Payment
     * @throws ApiError
     */
    public static paymentsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Payment.
         */
        id: number,
        requestBody?: PatchedPayment,
    }): CancelablePromise<Payment> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/payments/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for payments
     * @returns void
     * @throws ApiError
     */
    public static paymentsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Payment.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/payments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get payment summary statistics
     * @returns Payment
     * @throws ApiError
     */
    public static paymentsSummaryRetrieve(): CancelablePromise<Payment> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/payments/summary/',
        });
    }
}
