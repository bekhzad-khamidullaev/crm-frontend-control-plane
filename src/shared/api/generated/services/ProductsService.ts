/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedProductList } from '../models/PaginatedProductList';
import type { PatchedProduct } from '../models/PatchedProduct';
import type { Product } from '../models/Product';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProductsService {
    /**
     * CRUD API for products/services
     * @returns PaginatedProductList
     * @throws ApiError
     */
    public static productsList({
        currency,
        onSale,
        ordering,
        page,
        pageSize,
        productCategory,
        search,
        type,
    }: {
        currency?: number,
        onSale?: boolean,
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
        productCategory?: number,
        /**
         * A search term.
         */
        search?: string,
        /**
         * * `G` - Goods
         * * `S` - Service
         */
        type?: 'G' | 'S' | null,
    }): CancelablePromise<PaginatedProductList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/',
            query: {
                'currency': currency,
                'on_sale': onSale,
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'product_category': productCategory,
                'search': search,
                'type': type,
            },
        });
    }
    /**
     * CRUD API for products/services
     * @returns Product
     * @throws ApiError
     */
    public static productsCreate({
        requestBody,
    }: {
        requestBody?: Product,
    }): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for products/services
     * @returns Product
     * @throws ApiError
     */
    public static productsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Product.
         */
        id: number,
    }): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD API for products/services
     * @returns Product
     * @throws ApiError
     */
    public static productsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Product.
         */
        id: number,
        requestBody?: Product,
    }): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for products/services
     * @returns Product
     * @throws ApiError
     */
    public static productsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Product.
         */
        id: number,
        requestBody?: PatchedProduct,
    }): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/products/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD API for products/services
     * @returns void
     * @throws ApiError
     */
    public static productsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Product.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/products/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
