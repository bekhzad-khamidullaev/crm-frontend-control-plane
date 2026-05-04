/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModeEnum } from './ModeEnum';
/**
 * Serializer for AI assist response payload.
 */
export type AIAssistResponse = {
    provider: string;
    provider_name: string;
    model: string;
    output_text: string;
    use_case: string;
    request_id: string;
    surface: string;
    mode: ModeEnum;
    evidence?: Array<string>;
    risk_flags?: Array<string>;
    meta?: Record<string, any>;
    response_data?: Record<string, any>;
};

