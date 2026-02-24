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
    public static settingsmassmailRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/massmail/',
        });
    }
    /**
     * Get or update massmail settings
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsmassmailPartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/massmail/',
        });
    }
    /**
     * Get list of public email domains
     * @returns any No response body
     * @throws ApiError
     */
    public static settingspublicEmailDomainsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/public_email_domains/',
        });
    }
    /**
     * Get or update reminder settings
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsremindersRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/settings/reminders/',
        });
    }
    /**
     * Get or update reminder settings
     * @returns any No response body
     * @throws ApiError
     */
    public static settingsremindersPartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/settings/reminders/',
        });
    }
}
