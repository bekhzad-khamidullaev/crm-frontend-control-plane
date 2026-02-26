/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Stage = {
    readonly id: number;
    name: string;
    /**
     * Will be selected by default when creating a new task
     */
    default?: boolean;
    /**
     * The sequence number of the stage.         The indices of other instances will be sorted automatically.
     */
    index_number?: number;
    /**
     * Will be selected next after the default stage.
     */
    second_default?: boolean;
    success_stage?: boolean;
    /**
     * For example, receiving the first payment
     */
    conditional_success_stage?: boolean;
    /**
     * Have the goods been shipped at this stage already?
     */
    goods_shipped?: boolean;
    department: number;
};

