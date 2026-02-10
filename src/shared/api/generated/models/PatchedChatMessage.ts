/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PatchedChatMessage = {
    readonly id?: number;
    content?: string;
    readonly owner?: number | null;
    readonly owner_name?: string;
    answer_to?: number | null;
    topic?: number | null;
    recipients?: Array<number>;
    readonly recipient_names?: string;
    to?: Array<number>;
    content_type?: number;
    readonly content_type_name?: string;
    object_id?: number;
    readonly creation_date?: string;
};

