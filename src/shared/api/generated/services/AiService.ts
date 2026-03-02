/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIAssistProvidersResponse } from '../models/AIAssistProvidersResponse';
import type { AIAssistRequest } from '../models/AIAssistRequest';
import type { AIAssistResponse } from '../models/AIAssistResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AiService {
    /**
     * Unified AI assistant endpoint for CRM use-cases.
     * @returns AIAssistResponse
     * @throws ApiError
     */
    public static aiAssistCreate({
        requestBody,
    }: {
        requestBody: AIAssistRequest,
    }): CancelablePromise<AIAssistResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/assist/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List active providers for AI-assist UI without exposing secrets.
     * @returns AIAssistProvidersResponse
     * @throws ApiError
     */
    public static aiAssistProvidersList(): CancelablePromise<Array<AIAssistProvidersResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ai/assist/providers/',
        });
    }
}
