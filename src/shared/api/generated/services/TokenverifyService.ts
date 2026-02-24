/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TokenVerify } from '../models/TokenVerify';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TokenverifyService {
    /**
     * Takes a token and indicates if it is valid.  This view provides no
     * information about a token's fitness for a particular use.
     * @returns TokenVerify
     * @throws ApiError
     */
    public static tokenverifyCreate({
        requestBody,
    }: {
        requestBody: TokenVerify,
    }): CancelablePromise<TokenVerify> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/token/verify/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
