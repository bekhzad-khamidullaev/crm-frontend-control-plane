/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SchemaService {
    /**
     * Thread-safe OpenAPI schema endpoint.
     *
     * drf-spectacular schema generation is expensive and can return intermittent
     * errors under high concurrency. We serialize first-generation work and serve
     * cached payload for subsequent requests.
     * @returns any No response body
     * @throws ApiError
     */
    public static schemaRetrieve({
        format,
    }: {
        format?: 'json' | 'yaml',
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/schema/',
            query: {
                'format': format,
            },
        });
    }
}
