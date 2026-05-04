/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BusinessProcessLifecycleStatusEnum } from './BusinessProcessLifecycleStatusEnum';
export type PatchedContentPlan = {
    readonly id?: number;
    name?: string;
    description?: string;
    readonly owner?: number | null;
    workspace?: number | null;
    campaign?: number | null;
    readonly campaign_name?: string;
    timezone?: string;
    status?: BusinessProcessLifecycleStatusEnum;
    start_date?: string | null;
    end_date?: string | null;
    readonly archived_at?: string | null;
    readonly created_at?: string;
    readonly updated_at?: string;
};

