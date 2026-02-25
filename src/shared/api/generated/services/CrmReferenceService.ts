/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { City } from '../models/City';
import type { ClientType } from '../models/ClientType';
import type { ClosingReason } from '../models/ClosingReason';
import type { Country } from '../models/Country';
import type { Currency } from '../models/Currency';
import type { Industry } from '../models/Industry';
import type { LeadSource } from '../models/LeadSource';
import type { PaginatedCityList } from '../models/PaginatedCityList';
import type { PaginatedClientTypeList } from '../models/PaginatedClientTypeList';
import type { PaginatedClosingReasonList } from '../models/PaginatedClosingReasonList';
import type { PaginatedCountryList } from '../models/PaginatedCountryList';
import type { PaginatedCurrencyList } from '../models/PaginatedCurrencyList';
import type { PaginatedIndustryList } from '../models/PaginatedIndustryList';
import type { PaginatedLeadSourceList } from '../models/PaginatedLeadSourceList';
import type { PaginatedProductCategoryList } from '../models/PaginatedProductCategoryList';
import type { PaginatedRateList } from '../models/PaginatedRateList';
import type { ProductCategory } from '../models/ProductCategory';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CrmReferenceService {
    /**
     * Read-only API for cities
     * @returns PaginatedCityList
     * @throws ApiError
     */
    public static citiesList({
        country,
        ordering,
        page,
        pageSize,
        search,
    }: {
        country?: number,
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
    }): CancelablePromise<PaginatedCityList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cities/',
            query: {
                'country': country,
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Read-only API for cities
     * @returns City
     * @throws ApiError
     */
    public static citiesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this City.
         */
        id: number,
    }): CancelablePromise<City> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cities/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Read-only API for client types
     * @returns PaginatedClientTypeList
     * @throws ApiError
     */
    public static clientTypesList({
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedClientTypeList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/client-types/',
            query: {
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Read-only API for client types
     * @returns ClientType
     * @throws ApiError
     */
    public static clientTypesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Type of Clients.
         */
        id: number,
    }): CancelablePromise<ClientType> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/client-types/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Read-only API for closing reasons
     * @returns PaginatedClosingReasonList
     * @throws ApiError
     */
    public static closingReasonsList({
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedClosingReasonList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/closing-reasons/',
            query: {
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Read-only API for closing reasons
     * @returns ClosingReason
     * @throws ApiError
     */
    public static closingReasonsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Closing reason.
         */
        id: number,
    }): CancelablePromise<ClosingReason> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/closing-reasons/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Read-only API for countries
     * @returns PaginatedCountryList
     * @throws ApiError
     */
    public static countriesList({
        name,
        ordering,
        page,
        pageSize,
        search,
    }: {
        name?: string,
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
    }): CancelablePromise<PaginatedCountryList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/countries/',
            query: {
                'name': name,
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Read-only API for countries
     * @returns Country
     * @throws ApiError
     */
    public static countriesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Country.
         */
        id: number,
    }): CancelablePromise<Country> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/countries/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Read-only API for currencies
     * @returns PaginatedCurrencyList
     * @throws ApiError
     */
    public static currenciesList({
        ordering,
        page,
        pageSize,
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
         * Number of results to return per page.
         */
        pageSize?: number,
        /**
         * A search term.
         */
        search?: string,
    }): CancelablePromise<PaginatedCurrencyList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/currencies/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Read-only API for currencies
     * @returns Currency
     * @throws ApiError
     */
    public static currenciesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Currency.
         */
        id: number,
    }): CancelablePromise<Currency> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/currencies/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get exchange rate history for a currency
     * @returns PaginatedRateList
     * @throws ApiError
     */
    public static currenciesRatesList({
        id,
        ordering,
        page,
        pageSize,
        search,
    }: {
        /**
         * A unique integer value identifying this Currency.
         */
        id: number,
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
    }): CancelablePromise<PaginatedRateList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/currencies/{id}/rates/',
            path: {
                'id': id,
            },
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Read-only API for industries
     * @returns PaginatedIndustryList
     * @throws ApiError
     */
    public static industriesList({
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedIndustryList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/industries/',
            query: {
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Read-only API for industries
     * @returns Industry
     * @throws ApiError
     */
    public static industriesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Industry of Clients.
         */
        id: number,
    }): CancelablePromise<Industry> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/industries/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Read-only API for lead sources
     * @returns PaginatedLeadSourceList
     * @throws ApiError
     */
    public static leadSourcesList({
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedLeadSourceList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/lead-sources/',
            query: {
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Read-only API for lead sources
     * @returns LeadSource
     * @throws ApiError
     */
    public static leadSourcesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Lead Source.
         */
        id: number,
    }): CancelablePromise<LeadSource> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/lead-sources/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Read-only API for product categories
     * @returns PaginatedProductCategoryList
     * @throws ApiError
     */
    public static productCategoriesList({
        page,
        pageSize,
        search,
    }: {
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
    }): CancelablePromise<PaginatedProductCategoryList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/product-categories/',
            query: {
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Read-only API for product categories
     * @returns ProductCategory
     * @throws ApiError
     */
    public static productCategoriesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Product category.
         */
        id: number,
    }): CancelablePromise<ProductCategory> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/product-categories/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
