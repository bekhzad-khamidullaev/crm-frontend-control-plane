/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UseCaseEnum } from './UseCaseEnum';
/**
 * Serializer for AI assist requests.
 */
export type AIAssistRequest = {
    provider_id?: string;
    use_case?: UseCaseEnum;
    input_text: string;
    crm_context?: any;
    system_prompt?: string;
    temperature?: number;
    max_tokens?: number;
};

