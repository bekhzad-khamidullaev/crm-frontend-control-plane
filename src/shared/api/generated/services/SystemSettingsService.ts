/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemSettingsService {
    /**
     * Get or update massmail settings
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsMassmailRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/massmail/',
        });
    }
    /**
     * Get or update massmail settings
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsMassmailPartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/massmail/',
        });
    }
    /**
     * Get list of public email domains
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsPublicEmailDomainsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/public_email_domains/',
        });
    }
    /**
     * Get or update reminder settings
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsRemindersRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/reminders/',
        });
    }
    /**
     * Get or update reminder settings
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsRemindersPartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/reminders/',
        });
    }
}
