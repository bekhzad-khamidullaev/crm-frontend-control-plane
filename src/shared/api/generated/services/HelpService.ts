/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Page } from '../models/Page';
import type { PaginatedPageList } from '../models/PaginatedPageList';
import type { PaginatedParagraphList } from '../models/PaginatedParagraphList';
import type { Paragraph } from '../models/Paragraph';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HelpService {
    /**
     * @returns PaginatedPageList
     * @throws ApiError
     */
    public static helpPagesList({
        languageCode,
        page,
        pageSize,
        search,
    }: {
        /**
         * * `ar` - Arabic
         * * `cs` - Czech
         * * `de` - German
         * * `el` - Greek
         * * `en` - English
         * * `es` - Spanish
         * * `fr` - French
         * * `he` - Hebrew
         * * `hi` - Hindi
         * * `id` - Indonesian
         * * `it` - Italian
         * * `ja` - Japanese
         * * `ko` - Korean
         * * `nl` - Nederlands
         * * `pl` - Polish
         * * `pt-br` - Portuguese
         * * `ro` - Romanian
         * * `ru` - Russian
         * * `tr` - Turkish
         * * `uk` - Ukrainian
         * * `vi` - Vietnamese
         * * `zh-hans` - Chinese
         * * `uz` - Uzbek
         */
        languageCode?: 'ar' | 'cs' | 'de' | 'el' | 'en' | 'es' | 'fr' | 'he' | 'hi' | 'id' | 'it' | 'ja' | 'ko' | 'nl' | 'pl' | 'pt-br' | 'ro' | 'ru' | 'tr' | 'uk' | 'uz' | 'vi' | 'zh-hans',
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
    }): CancelablePromise<PaginatedPageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/help/pages/',
            query: {
                'language_code': languageCode,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns Page
     * @throws ApiError
     */
    public static helpPagesRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Help page.
         */
        id: number,
    }): CancelablePromise<Page> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/help/pages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedParagraphList
     * @throws ApiError
     */
    public static helpParagraphsList({
        document,
        languageCode,
        page,
        pageSize,
    }: {
        document?: number,
        /**
         * * `ar` - Arabic
         * * `cs` - Czech
         * * `de` - German
         * * `el` - Greek
         * * `en` - English
         * * `es` - Spanish
         * * `fr` - French
         * * `he` - Hebrew
         * * `hi` - Hindi
         * * `id` - Indonesian
         * * `it` - Italian
         * * `ja` - Japanese
         * * `ko` - Korean
         * * `nl` - Nederlands
         * * `pl` - Polish
         * * `pt-br` - Portuguese
         * * `ro` - Romanian
         * * `ru` - Russian
         * * `tr` - Turkish
         * * `uk` - Ukrainian
         * * `vi` - Vietnamese
         * * `zh-hans` - Chinese
         * * `uz` - Uzbek
         */
        languageCode?: 'ar' | 'cs' | 'de' | 'el' | 'en' | 'es' | 'fr' | 'he' | 'hi' | 'id' | 'it' | 'ja' | 'ko' | 'nl' | 'pl' | 'pt-br' | 'ro' | 'ru' | 'tr' | 'uk' | 'uz' | 'vi' | 'zh-hans',
        /**
         * A page number within the paginated result set.
         */
        page?: number,
        /**
         * Number of results to return per page.
         */
        pageSize?: number,
    }): CancelablePromise<PaginatedParagraphList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/help/paragraphs/',
            query: {
                'document': document,
                'language_code': languageCode,
                'page': page,
                'page_size': pageSize,
            },
        });
    }
    /**
     * @returns Paragraph
     * @throws ApiError
     */
    public static helpParagraphsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Paragraph.
         */
        id: number,
    }): CancelablePromise<Paragraph> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/help/paragraphs/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
