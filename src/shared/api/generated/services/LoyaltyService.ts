/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoyaltyAccount } from '../models/LoyaltyAccount';
import type { LoyaltyCoupon } from '../models/LoyaltyCoupon';
import type { LoyaltyEventIngest } from '../models/LoyaltyEventIngest';
import type { LoyaltyImportJob } from '../models/LoyaltyImportJob';
import type { LoyaltyOffer } from '../models/LoyaltyOffer';
import type { LoyaltyProgram } from '../models/LoyaltyProgram';
import type { PaginatedLoyaltyAccountList } from '../models/PaginatedLoyaltyAccountList';
import type { PaginatedLoyaltyCouponList } from '../models/PaginatedLoyaltyCouponList';
import type { PaginatedLoyaltyImportJobList } from '../models/PaginatedLoyaltyImportJobList';
import type { PaginatedLoyaltyOfferList } from '../models/PaginatedLoyaltyOfferList';
import type { PaginatedLoyaltyProgramList } from '../models/PaginatedLoyaltyProgramList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LoyaltyService {
    /**
     * @returns PaginatedLoyaltyAccountList
     * @throws ApiError
     */
    public static loyaltyAccountsList({
        company,
        contact,
        currentTier,
        ordering,
        page,
        pageSize,
        program,
        search,
        status,
    }: {
        company?: number,
        contact?: number,
        currentTier?: number,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        program?: number,
        /**
         * A search term.
         */
        search?: string,
        /**
         * * `active` - active
         * * `suspended` - suspended
         * * `archived` - archived
         */
        status?: 'active' | 'archived' | 'suspended',
    }): CancelablePromise<PaginatedLoyaltyAccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/accounts/',
            query: {
                'company': company,
                'contact': contact,
                'current_tier': currentTier,
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'program': program,
                'search': search,
                'status': status,
            },
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Loyalty account.
         */
        id: number,
    }): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsArbitrateOffersCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Loyalty account.
         */
        id: number,
        requestBody: LoyaltyAccount,
    }): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loyalty/accounts/{id}/arbitrate-offers/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsCommitRedemptionCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Loyalty account.
         */
        id: number,
        requestBody: LoyaltyAccount,
    }): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loyalty/accounts/{id}/commit-redemption/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsEligibilityRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Loyalty account.
         */
        id: number,
    }): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/accounts/{id}/eligibility/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsLedgerRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Loyalty account.
         */
        id: number,
    }): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/accounts/{id}/ledger/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsPreviewRedemptionCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Loyalty account.
         */
        id: number,
        requestBody: LoyaltyAccount,
    }): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loyalty/accounts/{id}/preview-redemption/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsReverseRedemptionCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Loyalty account.
         */
        id: number,
        requestBody: LoyaltyAccount,
    }): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loyalty/accounts/{id}/reverse-redemption/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsRiskSignalsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Loyalty account.
         */
        id: number,
    }): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/accounts/{id}/risk-signals/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsTimelineRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Loyalty account.
         */
        id: number,
    }): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/accounts/{id}/timeline/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsEnsureCreate({
        requestBody,
    }: {
        requestBody: LoyaltyAccount,
    }): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loyalty/accounts/ensure/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyAccountsSummaryRetrieve(): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/accounts/summary/',
        });
    }
    /**
     * @returns PaginatedLoyaltyCouponList
     * @throws ApiError
     */
    public static loyaltyCouponsList({
        account,
        offer,
        ordering,
        page,
        pageSize,
        search,
        status,
    }: {
        account?: number,
        offer?: number,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
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
        /**
         * * `issued` - issued
         * * `redeemed` - redeemed
         * * `expired` - expired
         * * `cancelled` - cancelled
         */
        status?: 'cancelled' | 'expired' | 'issued' | 'redeemed',
    }): CancelablePromise<PaginatedLoyaltyCouponList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/coupons/',
            query: {
                'account': account,
                'offer': offer,
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'status': status,
            },
        });
    }
    /**
     * @returns LoyaltyCoupon
     * @throws ApiError
     */
    public static loyaltyCouponsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Loyalty coupon.
         */
        id: number,
    }): CancelablePromise<LoyaltyCoupon> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/coupons/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LoyaltyEventIngest
     * @throws ApiError
     */
    public static loyaltyEventsCreate({
        requestBody,
    }: {
        requestBody: LoyaltyEventIngest,
    }): CancelablePromise<LoyaltyEventIngest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loyalty/events/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LoyaltyEventIngest
     * @throws ApiError
     */
    public static loyaltyEventsIngestCreate({
        requestBody,
    }: {
        requestBody: LoyaltyEventIngest,
    }): CancelablePromise<LoyaltyEventIngest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loyalty/events/ingest/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LoyaltyEventIngest
     * @throws ApiError
     */
    public static loyaltyEventsValidateCreate({
        requestBody,
    }: {
        requestBody: LoyaltyEventIngest,
    }): CancelablePromise<LoyaltyEventIngest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loyalty/events/validate/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedLoyaltyImportJobList
     * @throws ApiError
     */
    public static loyaltyImportJobsList({
        ordering,
        page,
        pageSize,
        search,
        source,
        status,
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
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
        source?: string,
        /**
         * * `pending` - pending
         * * `running` - running
         * * `completed` - completed
         * * `failed` - failed
         */
        status?: 'completed' | 'failed' | 'pending' | 'running',
    }): CancelablePromise<PaginatedLoyaltyImportJobList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/import-jobs/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
                'source': source,
                'status': status,
            },
        });
    }
    /**
     * @returns LoyaltyImportJob
     * @throws ApiError
     */
    public static loyaltyImportJobsCreate({
        requestBody,
    }: {
        requestBody?: LoyaltyImportJob,
    }): CancelablePromise<LoyaltyImportJob> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loyalty/import-jobs/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns LoyaltyImportJob
     * @throws ApiError
     */
    public static loyaltyImportJobsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Loyalty import job.
         */
        id: number,
    }): CancelablePromise<LoyaltyImportJob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/import-jobs/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LoyaltyImportJob
     * @throws ApiError
     */
    public static loyaltyImportJobsReplayCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Loyalty import job.
         */
        id: number,
        requestBody?: LoyaltyImportJob,
    }): CancelablePromise<LoyaltyImportJob> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loyalty/import-jobs/{id}/replay/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedLoyaltyOfferList
     * @throws ApiError
     */
    public static loyaltyOffersList({
        offerType,
        ordering,
        page,
        pageSize,
        program,
        search,
        status,
    }: {
        /**
         * * `coupon` - coupon
         * * `cashback` - cashback
         * * `discount` - discount
         */
        offerType?: 'cashback' | 'coupon' | 'discount',
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
        program?: number,
        /**
         * A search term.
         */
        search?: string,
        /**
         * * `draft` - draft
         * * `active` - active
         * * `archived` - archived
         */
        status?: 'active' | 'archived' | 'draft',
    }): CancelablePromise<PaginatedLoyaltyOfferList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/offers/',
            query: {
                'offer_type': offerType,
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'program': program,
                'search': search,
                'status': status,
            },
        });
    }
    /**
     * @returns LoyaltyOffer
     * @throws ApiError
     */
    public static loyaltyOffersRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Loyalty offer.
         */
        id: number,
    }): CancelablePromise<LoyaltyOffer> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/offers/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltyOperationsQueueRetrieve(): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/operations/queue/',
        });
    }
    /**
     * @returns PaginatedLoyaltyProgramList
     * @throws ApiError
     */
    public static loyaltyProgramsList({
        department,
        isActive,
        ordering,
        page,
        pageSize,
        search,
    }: {
        department?: number,
        isActive?: boolean,
        /**
         * Which field to use when ordering the results.
         */
        ordering?: string,
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
    }): CancelablePromise<PaginatedLoyaltyProgramList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/programs/',
            query: {
                'department': department,
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns LoyaltyProgram
     * @throws ApiError
     */
    public static loyaltyProgramsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Loyalty program.
         */
        id: number,
    }): CancelablePromise<LoyaltyProgram> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/programs/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns LoyaltyAccount
     * @throws ApiError
     */
    public static loyaltySummaryRetrieve(): CancelablePromise<LoyaltyAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loyalty/summary/',
        });
    }
}
