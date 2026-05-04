/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CrmDataService {
    /**
     * Export all CRM data to XLSX.
     * @returns binary
     * @throws ApiError
     */
    public static crmDataExportXlsx({
        scope,
    }: {
        /**
         * Export scope: "full" (default) or "reference".
         */
        scope?: string,
    }): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/crm-data/export/',
            query: {
                'scope': scope,
            },
        });
    }
    /**
     * Import CRM data from XLSX.
     * @returns any
     * @throws ApiError
     */
    public static crmDataImportXlsx({
        file,
        scope,
        formData,
    }: {
        /**
         * Upload XLSX file in multipart/form-data field "file".
         */
        file?: Blob,
        /**
         * Import scope: "full" (default) or "reference".
         */
        scope?: string,
        formData?: Record<string, any>,
    }): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/crm-data/import/',
            query: {
                'file': file,
                'scope': scope,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
