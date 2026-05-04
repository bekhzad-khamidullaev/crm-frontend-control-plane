/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIProviderSettingsProviderEnum } from './AIProviderSettingsProviderEnum';
/**
 * Serializer for AI provider settings.
 */
export type AIProviderSettings = {
    readonly id: string;
    /**
     * Human-readable provider name for UI and routing
     */
    name: string;
    provider: AIProviderSettingsProviderEnum;
    api_key?: string;
    readonly api_key_preview: string;
    /**
     * Optional custom base URL for self-hosted or compatible APIs
     */
    base_url?: string;
    model?: string;
    is_active?: boolean;
    /**
     * Used as fallback when request does not specify provider
     */
    is_default?: boolean;
    timeout_seconds?: number;
    temperature?: number;
    max_tokens?: number;
    extra_headers?: any;
    /**
     * Provider-specific options (e.g., anthropic_version, endpoint)
     */
    extra_config?: any;
    readonly created_at: string;
    readonly updated_at: string;
};

