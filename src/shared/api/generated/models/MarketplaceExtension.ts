/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MarketplaceExtensionStatusEnum } from './MarketplaceExtensionStatusEnum';
export type MarketplaceExtension = {
    readonly id: string;
    readonly code: string;
    readonly name: string;
    readonly manifest_version: string;
    readonly installed_version: string;
    readonly status: MarketplaceExtensionStatusEnum;
    readonly is_enabled: boolean;
    readonly manifest: any;
    readonly compatibility: any;
    readonly diagnostics: any;
    readonly last_error: string;
    readonly installed_at: string;
    readonly updated_at: string;
    readonly created_at: string;
};

