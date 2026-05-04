/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MassmailSettings } from '../models/MassmailSettings';
import type { PatchedMassmailSettings } from '../models/PatchedMassmailSettings';
import type { PatchedRemindersSettings } from '../models/PatchedRemindersSettings';
import type { PublicEmailDomains } from '../models/PublicEmailDomains';
import type { RemindersSettings } from '../models/RemindersSettings';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemSettingsService {
    /**
     * Get or update massmail settings
     * @returns MassmailSettings
     * @throws ApiError
     */
    public static settingsMassmailRetrieve(): CancelablePromise<MassmailSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/massmail/',
        });
    }
    /**
     * Get or update massmail settings
     * @returns MassmailSettings
     * @throws ApiError
     */
    public static settingsMassmailPartialUpdate({
        requestBody,
    }: {
        requestBody?: PatchedMassmailSettings,
    }): CancelablePromise<MassmailSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/massmail/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get list of public email domains
     * @returns PublicEmailDomains
     * @throws ApiError
     */
    public static settingsPublicEmailDomainsRetrieve(): CancelablePromise<PublicEmailDomains> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/public_email_domains/',
        });
    }
    /**
     * Get or update reminder settings
     * @returns RemindersSettings
     * @throws ApiError
     */
    public static settingsRemindersRetrieve(): CancelablePromise<RemindersSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/reminders/',
        });
    }
    /**
     * Get or update reminder settings
     * @returns RemindersSettings
     * @throws ApiError
     */
    public static settingsRemindersPartialUpdate({
        requestBody,
    }: {
        requestBody?: PatchedRemindersSettings,
    }): CancelablePromise<RemindersSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/reminders/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
