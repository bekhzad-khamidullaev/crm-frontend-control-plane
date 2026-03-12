/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIProviderSettings } from '../models/AIProviderSettings';
import type { APIKey } from '../models/APIKey';
import type { APIKeyCreate } from '../models/APIKeyCreate';
import type { ComplianceAuditLog } from '../models/ComplianceAuditLog';
import type { ConsentRecord } from '../models/ConsentRecord';
import type { DataRetentionPolicy } from '../models/DataRetentionPolicy';
import type { DataSubjectRequest } from '../models/DataSubjectRequest';
import type { FacebookPage } from '../models/FacebookPage';
import type { FacebookPageCreate } from '../models/FacebookPageCreate';
import type { InstagramAccount } from '../models/InstagramAccount';
import type { InstagramAccountCreate } from '../models/InstagramAccountCreate';
import type { IntegrationLog } from '../models/IntegrationLog';
import type { OmnichannelMessage } from '../models/OmnichannelMessage';
import type { PaginatedAIProviderSettingsList } from '../models/PaginatedAIProviderSettingsList';
import type { PaginatedAPIKeyList } from '../models/PaginatedAPIKeyList';
import type { PaginatedComplianceAuditLogList } from '../models/PaginatedComplianceAuditLogList';
import type { PaginatedConsentRecordList } from '../models/PaginatedConsentRecordList';
import type { PaginatedDataRetentionPolicyList } from '../models/PaginatedDataRetentionPolicyList';
import type { PaginatedDataSubjectRequestList } from '../models/PaginatedDataSubjectRequestList';
import type { PaginatedFacebookPageList } from '../models/PaginatedFacebookPageList';
import type { PaginatedInstagramAccountList } from '../models/PaginatedInstagramAccountList';
import type { PaginatedIntegrationLogList } from '../models/PaginatedIntegrationLogList';
import type { PaginatedTelegramBotList } from '../models/PaginatedTelegramBotList';
import type { PaginatedWebhookList } from '../models/PaginatedWebhookList';
import type { PaginatedWhatsAppBusinessAccountList } from '../models/PaginatedWhatsAppBusinessAccountList';
import type { PatchedAIProviderSettings } from '../models/PatchedAIProviderSettings';
import type { PatchedAPIKey } from '../models/PatchedAPIKey';
import type { PatchedConsentRecord } from '../models/PatchedConsentRecord';
import type { PatchedDataRetentionPolicy } from '../models/PatchedDataRetentionPolicy';
import type { PatchedDataSubjectRequest } from '../models/PatchedDataSubjectRequest';
import type { PatchedFacebookPage } from '../models/PatchedFacebookPage';
import type { PatchedInstagramAccount } from '../models/PatchedInstagramAccount';
import type { PatchedTelegramBot } from '../models/PatchedTelegramBot';
import type { PatchedWebhook } from '../models/PatchedWebhook';
import type { PatchedWhatsAppBusinessAccount } from '../models/PatchedWhatsAppBusinessAccount';
import type { TelegramBot } from '../models/TelegramBot';
import type { TelegramBotCreate } from '../models/TelegramBotCreate';
import type { Webhook } from '../models/Webhook';
import type { WebhookCreate } from '../models/WebhookCreate';
import type { WhatsAppBusinessAccount } from '../models/WhatsAppBusinessAccount';
import type { WhatsAppBusinessAccountCreate } from '../models/WhatsAppBusinessAccountCreate';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SettingsService {
    /**
     * CRUD for AI provider configurations.
     * @returns PaginatedAIProviderSettingsList
     * @throws ApiError
     */
    public static settingsAiProvidersList({
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
    }): CancelablePromise<PaginatedAIProviderSettingsList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/ai/providers/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * CRUD for AI provider configurations.
     * @returns AIProviderSettings
     * @throws ApiError
     */
    public static settingsAiProvidersCreate({
        requestBody,
    }: {
        requestBody: AIProviderSettings,
    }): CancelablePromise<AIProviderSettings> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/ai/providers/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for AI provider configurations.
     * @returns AIProviderSettings
     * @throws ApiError
     */
    public static settingsAiProvidersRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this AI Provider Settings.
         */
        id: string,
    }): CancelablePromise<AIProviderSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/ai/providers/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for AI provider configurations.
     * @returns AIProviderSettings
     * @throws ApiError
     */
    public static settingsAiProvidersUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this AI Provider Settings.
         */
        id: string,
        requestBody: AIProviderSettings,
    }): CancelablePromise<AIProviderSettings> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/ai/providers/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for AI provider configurations.
     * @returns AIProviderSettings
     * @throws ApiError
     */
    public static settingsAiProvidersPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this AI Provider Settings.
         */
        id: string,
        requestBody?: PatchedAIProviderSettings,
    }): CancelablePromise<AIProviderSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/ai/providers/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * CRUD for AI provider configurations.
     * @returns void
     * @throws ApiError
     */
    public static settingsAiProvidersDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this AI Provider Settings.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/ai/providers/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Perform a lightweight generation call to validate provider setup.
     * @returns AIProviderSettings
     * @throws ApiError
     */
    public static settingsAiProvidersTestConnectionCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this AI Provider Settings.
         */
        id: string,
        requestBody: AIProviderSettings,
    }): CancelablePromise<AIProviderSettings> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/ai/providers/{id}/test_connection/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for API key management.
     *
     * Endpoints:
     * - GET /api/settings/api-keys/ - List all API keys
     * - POST /api/settings/api-keys/ - Create new API key
     * - GET /api/settings/api-keys/{id}/ - Get specific key
     * - DELETE /api/settings/api-keys/{id}/ - Delete key
     * - POST /api/settings/api-keys/{id}/revoke/ - Revoke key
     * - GET /api/settings/api-keys/{id}/usage/ - Get usage stats
     * @returns PaginatedAPIKeyList
     * @throws ApiError
     */
    public static settingsApiKeysList({
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
    }): CancelablePromise<PaginatedAPIKeyList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/api-keys/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * Create a new API key with automatic key generation.
     * @returns APIKeyCreate
     * @throws ApiError
     */
    public static settingsApiKeysCreate({
        requestBody,
    }: {
        requestBody: APIKeyCreate,
    }): CancelablePromise<APIKeyCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/api-keys/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for API key management.
     *
     * Endpoints:
     * - GET /api/settings/api-keys/ - List all API keys
     * - POST /api/settings/api-keys/ - Create new API key
     * - GET /api/settings/api-keys/{id}/ - Get specific key
     * - DELETE /api/settings/api-keys/{id}/ - Delete key
     * - POST /api/settings/api-keys/{id}/revoke/ - Revoke key
     * - GET /api/settings/api-keys/{id}/usage/ - Get usage stats
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsApiKeysRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/api-keys/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for API key management.
     *
     * Endpoints:
     * - GET /api/settings/api-keys/ - List all API keys
     * - POST /api/settings/api-keys/ - Create new API key
     * - GET /api/settings/api-keys/{id}/ - Get specific key
     * - DELETE /api/settings/api-keys/{id}/ - Delete key
     * - POST /api/settings/api-keys/{id}/revoke/ - Revoke key
     * - GET /api/settings/api-keys/{id}/usage/ - Get usage stats
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsApiKeysUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
        requestBody: APIKey,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/api-keys/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for API key management.
     *
     * Endpoints:
     * - GET /api/settings/api-keys/ - List all API keys
     * - POST /api/settings/api-keys/ - Create new API key
     * - GET /api/settings/api-keys/{id}/ - Get specific key
     * - DELETE /api/settings/api-keys/{id}/ - Delete key
     * - POST /api/settings/api-keys/{id}/revoke/ - Revoke key
     * - GET /api/settings/api-keys/{id}/usage/ - Get usage stats
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsApiKeysPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
        requestBody?: PatchedAPIKey,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/api-keys/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for API key management.
     *
     * Endpoints:
     * - GET /api/settings/api-keys/ - List all API keys
     * - POST /api/settings/api-keys/ - Create new API key
     * - GET /api/settings/api-keys/{id}/ - Get specific key
     * - DELETE /api/settings/api-keys/{id}/ - Delete key
     * - POST /api/settings/api-keys/{id}/revoke/ - Revoke key
     * - GET /api/settings/api-keys/{id}/usage/ - Get usage stats
     * @returns void
     * @throws ApiError
     */
    public static settingsApiKeysDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/api-keys/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * POST /api/settings/api-keys/{id}/revoke/ - Revoke an API key.
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsApiKeysRevokeCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
        requestBody: APIKey,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/api-keys/{id}/revoke/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * GET /api/settings/api-keys/{id}/usage/ - Get usage statistics.
     * @returns APIKey
     * @throws ApiError
     */
    public static settingsApiKeysUsageRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this API Key.
         */
        id: string,
    }): CancelablePromise<APIKey> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/api-keys/{id}/usage/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns PaginatedComplianceAuditLogList
     * @throws ApiError
     */
    public static settingsComplianceAuditList({
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
    }): CancelablePromise<PaginatedComplianceAuditLogList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/compliance/audit/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns ComplianceAuditLog
     * @throws ApiError
     */
    public static settingsComplianceAuditRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Compliance Audit Log.
         */
        id: number,
    }): CancelablePromise<ComplianceAuditLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/compliance/audit/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ComplianceAuditLog
     * @throws ApiError
     */
    public static settingsComplianceAuditReportRetrieve(): CancelablePromise<ComplianceAuditLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/compliance/audit/report/',
        });
    }
    /**
     * @returns PaginatedConsentRecordList
     * @throws ApiError
     */
    public static settingsComplianceConsentsList({
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
    }): CancelablePromise<PaginatedConsentRecordList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/compliance/consents/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns ConsentRecord
     * @throws ApiError
     */
    public static settingsComplianceConsentsCreate({
        requestBody,
    }: {
        requestBody: ConsentRecord,
    }): CancelablePromise<ConsentRecord> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/compliance/consents/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ConsentRecord
     * @throws ApiError
     */
    public static settingsComplianceConsentsRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Consent Record.
         */
        id: number,
    }): CancelablePromise<ConsentRecord> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/compliance/consents/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ConsentRecord
     * @throws ApiError
     */
    public static settingsComplianceConsentsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Consent Record.
         */
        id: number,
        requestBody: ConsentRecord,
    }): CancelablePromise<ConsentRecord> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/compliance/consents/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ConsentRecord
     * @throws ApiError
     */
    public static settingsComplianceConsentsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Consent Record.
         */
        id: number,
        requestBody?: PatchedConsentRecord,
    }): CancelablePromise<ConsentRecord> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/compliance/consents/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static settingsComplianceConsentsDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Consent Record.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/compliance/consents/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns ConsentRecord
     * @throws ApiError
     */
    public static settingsComplianceConsentsRevokeCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Consent Record.
         */
        id: number,
        requestBody: ConsentRecord,
    }): CancelablePromise<ConsentRecord> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/compliance/consents/{id}/revoke/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedDataSubjectRequestList
     * @throws ApiError
     */
    public static settingsComplianceDsrList({
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
    }): CancelablePromise<PaginatedDataSubjectRequestList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/compliance/dsr/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns DataSubjectRequest
     * @throws ApiError
     */
    public static settingsComplianceDsrCreate({
        requestBody,
    }: {
        requestBody: DataSubjectRequest,
    }): CancelablePromise<DataSubjectRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/compliance/dsr/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns DataSubjectRequest
     * @throws ApiError
     */
    public static settingsComplianceDsrRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Data Subject Request.
         */
        id: number,
    }): CancelablePromise<DataSubjectRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/compliance/dsr/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns DataSubjectRequest
     * @throws ApiError
     */
    public static settingsComplianceDsrUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Data Subject Request.
         */
        id: number,
        requestBody: DataSubjectRequest,
    }): CancelablePromise<DataSubjectRequest> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/compliance/dsr/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns DataSubjectRequest
     * @throws ApiError
     */
    public static settingsComplianceDsrPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Data Subject Request.
         */
        id: number,
        requestBody?: PatchedDataSubjectRequest,
    }): CancelablePromise<DataSubjectRequest> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/compliance/dsr/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static settingsComplianceDsrDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Data Subject Request.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/compliance/dsr/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns DataSubjectRequest
     * @throws ApiError
     */
    public static settingsComplianceDsrExecuteCreate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Data Subject Request.
         */
        id: number,
        requestBody: DataSubjectRequest,
    }): CancelablePromise<DataSubjectRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/compliance/dsr/{id}/execute/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedDataRetentionPolicyList
     * @throws ApiError
     */
    public static settingsComplianceRetentionList({
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
    }): CancelablePromise<PaginatedDataRetentionPolicyList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/compliance/retention/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns DataRetentionPolicy
     * @throws ApiError
     */
    public static settingsComplianceRetentionCreate({
        requestBody,
    }: {
        requestBody: DataRetentionPolicy,
    }): CancelablePromise<DataRetentionPolicy> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/compliance/retention/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns DataRetentionPolicy
     * @throws ApiError
     */
    public static settingsComplianceRetentionRetrieve({
        id,
    }: {
        /**
         * A unique integer value identifying this Data Retention Policy.
         */
        id: number,
    }): CancelablePromise<DataRetentionPolicy> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/compliance/retention/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns DataRetentionPolicy
     * @throws ApiError
     */
    public static settingsComplianceRetentionUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Data Retention Policy.
         */
        id: number,
        requestBody: DataRetentionPolicy,
    }): CancelablePromise<DataRetentionPolicy> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/compliance/retention/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns DataRetentionPolicy
     * @throws ApiError
     */
    public static settingsComplianceRetentionPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A unique integer value identifying this Data Retention Policy.
         */
        id: number,
        requestBody?: PatchedDataRetentionPolicy,
    }): CancelablePromise<DataRetentionPolicy> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/compliance/retention/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static settingsComplianceRetentionDestroy({
        id,
    }: {
        /**
         * A unique integer value identifying this Data Retention Policy.
         */
        id: number,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/compliance/retention/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns DataRetentionPolicy
     * @throws ApiError
     */
    public static settingsComplianceRetentionRunCreate({
        requestBody,
    }: {
        requestBody: DataRetentionPolicy,
    }): CancelablePromise<DataRetentionPolicy> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/compliance/retention/run/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns PaginatedFacebookPageList
     * @throws ApiError
     */
    public static settingsFacebookPagesList({
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
    }): CancelablePromise<PaginatedFacebookPageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/facebook/pages/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns FacebookPageCreate
     * @throws ApiError
     */
    public static settingsFacebookPagesCreate({
        requestBody,
    }: {
        requestBody: FacebookPageCreate,
    }): CancelablePromise<FacebookPageCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/facebook/pages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsFacebookPagesRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Facebook Page.
         */
        id: string,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/facebook/pages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsFacebookPagesUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Facebook Page.
         */
        id: string,
        requestBody: FacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/facebook/pages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsFacebookPagesPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Facebook Page.
         */
        id: string,
        requestBody?: PatchedFacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/facebook/pages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Facebook Page integrations.
     *
     * Endpoints:
     * - GET /api/settings/facebook/pages/ - List all connected pages
     * - POST /api/settings/facebook/pages/ - Connect new Facebook page
     * - GET /api/settings/facebook/pages/{id}/ - Get page details
     * - PATCH /api/settings/facebook/pages/{id}/ - Update page settings
     * - DELETE /api/settings/facebook/pages/{id}/ - Disconnect page
     * - POST /api/settings/facebook/pages/{id}/test/ - Test connection
     * - POST /api/settings/facebook/pages/{id}/disconnect/ - Disconnect and cleanup
     * @returns void
     * @throws ApiError
     */
    public static settingsFacebookPagesDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this Facebook Page.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/facebook/pages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Disconnect Facebook page.
     *
     * Deactivates the page and removes webhook subscriptions.
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsFacebookPagesDisconnectCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Facebook Page.
         */
        id: string,
        requestBody: FacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/facebook/pages/{id}/disconnect/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Test Facebook page connection.
     *
     * Verifies that the access token is valid and can access Facebook API.
     * @returns FacebookPage
     * @throws ApiError
     */
    public static settingsFacebookPagesTestCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Facebook Page.
         */
        id: string,
        requestBody: FacebookPage,
    }): CancelablePromise<FacebookPage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/facebook/pages/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * GET /api/settings/general/ - Retrieve general settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsGeneralList(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/general/',
        });
    }
    /**
     * PATCH /api/settings/general/ - Update general settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsGeneralPartialUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/general/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns PaginatedInstagramAccountList
     * @throws ApiError
     */
    public static settingsInstagramAccountsList({
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
    }): CancelablePromise<PaginatedInstagramAccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/instagram/accounts/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns InstagramAccountCreate
     * @throws ApiError
     */
    public static settingsInstagramAccountsCreate({
        requestBody,
    }: {
        requestBody: InstagramAccountCreate,
    }): CancelablePromise<InstagramAccountCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/instagram/accounts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsInstagramAccountsRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Instagram Account.
         */
        id: string,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/instagram/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsInstagramAccountsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Instagram Account.
         */
        id: string,
        requestBody: InstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/instagram/accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsInstagramAccountsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Instagram Account.
         */
        id: string,
        requestBody?: PatchedInstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/instagram/accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Instagram Business Account integrations.
     *
     * Endpoints:
     * - GET /api/settings/instagram/accounts/ - List all connected accounts
     * - POST /api/settings/instagram/accounts/ - Connect new Instagram account
     * - GET /api/settings/instagram/accounts/{id}/ - Get account details
     * - PATCH /api/settings/instagram/accounts/{id}/ - Update account settings
     * - DELETE /api/settings/instagram/accounts/{id}/ - Disconnect account
     * - POST /api/settings/instagram/accounts/{id}/test/ - Test connection
     * - POST /api/settings/instagram/accounts/{id}/disconnect/ - Disconnect and cleanup
     * @returns void
     * @throws ApiError
     */
    public static settingsInstagramAccountsDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this Instagram Account.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/instagram/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Disconnect Instagram account.
     *
     * Deactivates the account and removes webhook subscriptions.
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsInstagramAccountsDisconnectCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Instagram Account.
         */
        id: string,
        requestBody: InstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/instagram/accounts/{id}/disconnect/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Test Instagram connection.
     *
     * Verifies that the access token is valid and can access Instagram API.
     * @returns InstagramAccount
     * @throws ApiError
     */
    public static settingsInstagramAccountsTestCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Instagram Account.
         */
        id: string,
        requestBody: InstagramAccount,
    }): CancelablePromise<InstagramAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/instagram/accounts/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for integration logs (read-only).
     *
     * Endpoints:
     * - GET /api/settings/integration-logs/ - List logs
     * - GET /api/settings/integration-logs/{id}/ - Get log detail
     * - GET /api/settings/integration-logs/export/ - Export logs
     * - DELETE /api/settings/integration-logs/cleanup/ - Cleanup old logs
     * - GET /api/settings/integration-logs/stats/ - Get statistics
     * @returns PaginatedIntegrationLogList
     * @throws ApiError
     */
    public static settingsIntegrationLogsList({
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
    }): CancelablePromise<PaginatedIntegrationLogList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/integration-logs/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for integration logs (read-only).
     *
     * Endpoints:
     * - GET /api/settings/integration-logs/ - List logs
     * - GET /api/settings/integration-logs/{id}/ - Get log detail
     * - GET /api/settings/integration-logs/export/ - Export logs
     * - DELETE /api/settings/integration-logs/cleanup/ - Cleanup old logs
     * - GET /api/settings/integration-logs/stats/ - Get statistics
     * @returns IntegrationLog
     * @throws ApiError
     */
    public static settingsIntegrationLogsRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Integration Log.
         */
        id: string,
    }): CancelablePromise<IntegrationLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/integration-logs/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * DELETE /api/settings/integration-logs/cleanup/ - Delete old logs.
     * @returns void
     * @throws ApiError
     */
    public static settingsIntegrationLogsCleanupDestroy(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/integration-logs/cleanup/',
        });
    }
    /**
     * GET /api/settings/integration-logs/export/ - Export logs as CSV or JSON.
     * @returns IntegrationLog
     * @throws ApiError
     */
    public static settingsIntegrationLogsExportRetrieve(): CancelablePromise<IntegrationLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/integration-logs/export/',
        });
    }
    /**
     * GET /api/settings/integration-logs/stats/ - Get integration statistics.
     * @returns IntegrationLog
     * @throws ApiError
     */
    public static settingsIntegrationLogsStatsRetrieve(): CancelablePromise<IntegrationLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/integration-logs/stats/',
        });
    }
    /**
     * GET /api/settings/notifications/ - Get global notification settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsNotificationsList(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/notifications/',
        });
    }
    /**
     * PATCH /api/settings/notifications/ - Update global settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsNotificationsPartialUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/notifications/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * POST /api/settings/notifications/test/ - Send test notification.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsNotificationsTestCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/notifications/test/',
        });
    }
    /**
     * GET/PATCH /api/settings/notifications/user/ - User-specific settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsNotificationsUserRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/notifications/user/',
        });
    }
    /**
     * GET/PATCH /api/settings/notifications/user/ - User-specific settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsNotificationsUserPartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/notifications/user/',
        });
    }
    /**
     * @returns OmnichannelMessage
     * @throws ApiError
     */
    public static settingsOmnichannelSendCreate({
        requestBody,
    }: {
        requestBody?: OmnichannelMessage,
    }): CancelablePromise<OmnichannelMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/omnichannel/send/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns OmnichannelMessage
     * @throws ApiError
     */
    public static settingsOmnichannelTimelineRetrieve(): CancelablePromise<OmnichannelMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/omnichannel/timeline/',
        });
    }
    /**
     * GET /api/settings/security/ - Get security settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsSecurityList(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/security/',
        });
    }
    /**
     * PATCH /api/settings/security/ - Update security settings.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsSecurityPartialUpdate({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/security/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * GET /api/settings/security/audit-log/ - Get security audit log.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsSecurityAuditLogRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/security/audit-log/',
        });
    }
    /**
     * GET /api/settings/security/sessions/ - List active sessions.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsSecuritySessionsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/security/sessions/',
        });
    }
    /**
     * DELETE /api/settings/security/sessions/{session_id}/ - Revoke specific session.
     * @returns void
     * @throws ApiError
     */
    public static settingsSecuritySessionsDestroy({
        sessionId,
    }: {
        sessionId: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/security/sessions/{session_id}/',
            path: {
                'session_id': sessionId,
            },
        });
    }
    /**
     * POST /api/settings/security/sessions/revoke-all/ - Revoke all sessions except current.
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsSecuritySessionsRevokeAllCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/security/sessions/revoke-all/',
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns PaginatedTelegramBotList
     * @throws ApiError
     */
    public static settingsTelegramBotsList({
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
    }): CancelablePromise<PaginatedTelegramBotList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/telegram/bots/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns TelegramBotCreate
     * @throws ApiError
     */
    public static settingsTelegramBotsCreate({
        requestBody,
    }: {
        requestBody: TelegramBotCreate,
    }): CancelablePromise<TelegramBotCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/telegram/bots/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Telegram Bot.
         */
        id: string,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/telegram/bots/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Telegram Bot.
         */
        id: string,
        requestBody?: TelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/telegram/bots/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Telegram Bot.
         */
        id: string,
        requestBody?: PatchedTelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/telegram/bots/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing Telegram Bot integrations.
     *
     * Endpoints:
     * - GET /api/settings/telegram/bots/ - List all connected bots
     * - POST /api/settings/telegram/bots/ - Connect new Telegram bot
     * - GET /api/settings/telegram/bots/{id}/ - Get bot details
     * - PATCH /api/settings/telegram/bots/{id}/ - Update bot settings
     * - DELETE /api/settings/telegram/bots/{id}/ - Remove bot
     * - POST /api/settings/telegram/bots/{id}/test/ - Test bot connection
     * - POST /api/settings/telegram/bots/{id}/set_webhook/ - Setup webhook
     * @returns void
     * @throws ApiError
     */
    public static settingsTelegramBotsDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this Telegram Bot.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/telegram/bots/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Disconnect Telegram bot without deleting record.
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsDisconnectCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Telegram Bot.
         */
        id: string,
        requestBody?: TelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/telegram/bots/{id}/disconnect/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Setup or update Telegram webhook.
     *
     * Configures the webhook URL for receiving updates from Telegram.
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsSetWebhookCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Telegram Bot.
         */
        id: string,
        requestBody?: TelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/telegram/bots/{id}/set_webhook/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Test Telegram bot connection.
     *
     * Calls Telegram API getMe to verify bot token is valid.
     * @returns TelegramBot
     * @throws ApiError
     */
    public static settingsTelegramBotsTestCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Telegram Bot.
         */
        id: string,
        requestBody?: TelegramBot,
    }): CancelablePromise<TelegramBot> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/telegram/bots/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns PaginatedWebhookList
     * @throws ApiError
     */
    public static settingsWebhooksList({
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
    }): CancelablePromise<PaginatedWebhookList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/webhooks/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns WebhookCreate
     * @throws ApiError
     */
    public static settingsWebhooksCreate({
        requestBody,
    }: {
        requestBody: WebhookCreate,
    }): CancelablePromise<WebhookCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/webhooks/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/webhooks/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
        requestBody: Webhook,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/webhooks/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
        requestBody?: PatchedWebhook,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/webhooks/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for webhook management.
     *
     * Endpoints:
     * - GET /api/settings/webhooks/ - List all webhooks
     * - POST /api/settings/webhooks/ - Create webhook
     * - GET /api/settings/webhooks/{id}/ - Get webhook
     * - PUT /api/settings/webhooks/{id}/ - Update webhook
     * - PATCH /api/settings/webhooks/{id}/ - Partial update
     * - DELETE /api/settings/webhooks/{id}/ - Delete webhook
     * - GET /api/settings/webhooks/{id}/deliveries/ - Delivery history
     * - POST /api/settings/webhooks/{id}/test/ - Test webhook
     * @returns void
     * @throws ApiError
     */
    public static settingsWebhooksDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/webhooks/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * GET /api/settings/webhooks/{id}/deliveries/ - Get delivery history.
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksDeliveriesRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/webhooks/{id}/deliveries/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * POST /api/settings/webhooks/{id}/deliveries/{delivery_id}/retry/ - Retry failed delivery.
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksDeliveriesRetryCreate({
        deliveryId,
        id,
        requestBody,
    }: {
        deliveryId: string,
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
        requestBody: Webhook,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/webhooks/{id}/deliveries/{delivery_id}/retry/',
            path: {
                'delivery_id': deliveryId,
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * POST /api/settings/webhooks/{id}/test/ - Test webhook with sample data.
     * @returns Webhook
     * @throws ApiError
     */
    public static settingsWebhooksTestCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this Webhook.
         */
        id: string,
        requestBody: Webhook,
    }): CancelablePromise<Webhook> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/webhooks/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PaginatedWhatsAppBusinessAccountList
     * @throws ApiError
     */
    public static settingsWhatsappAccountsList({
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
    }): CancelablePromise<PaginatedWhatsAppBusinessAccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/whatsapp/accounts/',
            query: {
                'ordering': ordering,
                'page': page,
                'page_size': pageSize,
                'search': search,
            },
        });
    }
    /**
     * @returns WhatsAppBusinessAccountCreate
     * @throws ApiError
     */
    public static settingsWhatsappAccountsCreate({
        requestBody,
    }: {
        requestBody: WhatsAppBusinessAccountCreate,
    }): CancelablePromise<WhatsAppBusinessAccountCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/whatsapp/accounts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns WhatsAppBusinessAccount
     * @throws ApiError
     */
    public static settingsWhatsappAccountsRetrieve({
        id,
    }: {
        /**
         * A UUID string identifying this WhatsApp Business Account.
         */
        id: string,
    }): CancelablePromise<WhatsAppBusinessAccount> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/whatsapp/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns WhatsAppBusinessAccount
     * @throws ApiError
     */
    public static settingsWhatsappAccountsUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this WhatsApp Business Account.
         */
        id: string,
        requestBody: WhatsAppBusinessAccount,
    }): CancelablePromise<WhatsAppBusinessAccount> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/whatsapp/accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns WhatsAppBusinessAccount
     * @throws ApiError
     */
    public static settingsWhatsappAccountsPartialUpdate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this WhatsApp Business Account.
         */
        id: string,
        requestBody?: PatchedWhatsAppBusinessAccount,
    }): CancelablePromise<WhatsAppBusinessAccount> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/whatsapp/accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static settingsWhatsappAccountsDestroy({
        id,
    }: {
        /**
         * A UUID string identifying this WhatsApp Business Account.
         */
        id: string,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/whatsapp/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns WhatsAppBusinessAccount
     * @throws ApiError
     */
    public static settingsWhatsappAccountsDisconnectCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this WhatsApp Business Account.
         */
        id: string,
        requestBody: WhatsAppBusinessAccount,
    }): CancelablePromise<WhatsAppBusinessAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/whatsapp/accounts/{id}/disconnect/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns WhatsAppBusinessAccount
     * @throws ApiError
     */
    public static settingsWhatsappAccountsTestCreate({
        id,
        requestBody,
    }: {
        /**
         * A UUID string identifying this WhatsApp Business Account.
         */
        id: string,
        requestBody: WhatsAppBusinessAccount,
    }): CancelablePromise<WhatsAppBusinessAccount> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/whatsapp/accounts/{id}/test/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
