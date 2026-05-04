/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StageEnum } from './StageEnum';
/**
 * Mixin to add validation helpers to serializers
 */
export type PatchedMemo = {
    readonly id?: number;
    name?: string;
    description?: string;
    note?: string;
    /**
     * Available only to the owner.
     */
    draft?: boolean;
    /**
     * The recipient and subscribers are notified.
     */
    notified?: boolean;
    review_date?: string | null;
    stage?: StageEnum;
    to?: number;
    readonly to_name?: string;
    task?: number | null;
    readonly task_name?: string;
    project?: number | null;
    readonly project_name?: string;
    deal?: number | null;
    readonly deal_name?: string;
    resolution?: number | null;
    readonly resolution_name?: string;
    readonly owner?: number | null;
    readonly owner_name?: string;
    tags?: Array<number>;
    readonly tag_names?: Array<string>;
    readonly creation_date?: string;
    readonly update_date?: string;
};

