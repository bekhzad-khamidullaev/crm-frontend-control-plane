/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Ensures name_ru/name_en/name_uz are always present in API output.
 * If a localized field is empty, falls back to base `name`.
 */
export type ProjectStage = {
    readonly id: number;
    name: string;
    name_ru?: string;
    name_en?: string;
    name_uz?: string;
    /**
     * Will be selected by default when creating a new task
     */
    default?: boolean;
    /**
     * Mark if this stage is "done"
     */
    done?: boolean;
    /**
     * Mark if this stage is "in progress"
     */
    in_progress?: boolean;
    /**
     * Is the project active at this stage?
     */
    active?: boolean;
    /**
     * The sequence number of the stage.         The indices of other instances will be sorted automatically.
     */
    index_number?: number;
};

