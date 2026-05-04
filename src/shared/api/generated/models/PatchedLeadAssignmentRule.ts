/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StrategyEnum } from './StrategyEnum';
export type PatchedLeadAssignmentRule = {
    readonly id?: string;
    name?: string;
    description?: string;
    is_active?: boolean;
    priority?: number;
    /**
     * Optional source filters. Empty list means any source.
     */
    lead_source_ids?: any;
    /**
     * Optional keyword filters for lead text fields.
     */
    keyword_contains?: any;
    strategy?: StrategyEnum;
    owner?: number | null;
    readonly owner_display?: string;
    candidate_users?: Array<number>;
    readonly candidate_user_displays?: Array<Record<string, any>>;
    readonly last_assigned_user?: number | null;
    readonly last_assigned_user_display?: string;
    version?: number;
    readonly created_by?: number | null;
    readonly updated_by?: number | null;
    readonly created_at?: string;
    readonly updated_at?: string;
};

