/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LandingPageStatusEnum } from './LandingPageStatusEnum';
export type LandingPageList = {
    readonly id: number;
    title: string;
    slug: string;
    custom_domain?: string | null;
    is_active?: boolean;
    status?: LandingPageStatusEnum;
    draft_version?: number;
    department?: number | null;
    readonly department_name: string;
    lead_source?: number | null;
    readonly lead_source_name: string;
    default_owner?: number | null;
    published_revision?: number | null;
    published_at?: string | null;
    archived_at?: string | null;
    readonly created_at: string;
    readonly updated_at: string;
};

