/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProjectStage = {
    readonly id: number;
    name: string;
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

