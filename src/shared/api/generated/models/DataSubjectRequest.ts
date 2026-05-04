/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataSubjectRequestStatusEnum } from './DataSubjectRequestStatusEnum';
import type { RequestTypeEnum } from './RequestTypeEnum';
export type DataSubjectRequest = {
    readonly id: number;
    request_type: RequestTypeEnum;
    readonly status: DataSubjectRequestStatusEnum;
    reason?: string;
    subject_content_type: number;
    subject_object_id: number;
    readonly subject_type: string;
    readonly requested_by: number | null;
    readonly processed_by: number | null;
    readonly result_payload: any;
    readonly error_message: string;
    readonly requested_at: string;
    readonly processed_at: string | null;
    readonly created_at: string;
    readonly updated_at: string;
};

