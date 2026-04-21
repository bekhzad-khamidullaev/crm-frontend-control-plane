/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ContentWorkflowStatus = {
    readonly id: number;
    readonly workspace: number;
    readonly owner: number | null;
    code: string;
    name: string;
    order_index?: number;
    is_terminal?: boolean;
    sla_hours?: number;
    readonly created_at: string;
    readonly updated_at: string;
};

