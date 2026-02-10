/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IntegrationLogStatusEnum } from './IntegrationLogStatusEnum';
/**
 * Serializer for integration logs.
 */
export type IntegrationLog = {
    readonly id: string;
    /**
     * Name of the integration (instagram, facebook, telegram, sms, voip)
     */
    integration: string;
    /**
     * Action performed (e.g., message_received, message_sent)
     */
    action: string;
    status: IntegrationLogStatusEnum;
    readonly timestamp: string;
    request_data?: any;
    response_data?: any;
    error_message?: string;
    duration_ms?: number | null;
    user?: number | null;
    readonly user_email: string | null;
    stack_trace?: string;
    metadata?: any;
};

