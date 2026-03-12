/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OmnichannelMessageDirectionEnum } from './OmnichannelMessageDirectionEnum';
export type OmnichannelMessage = {
    readonly id: number;
    readonly channel: number;
    readonly channel_type: string;
    readonly channel_name: string;
    readonly direction: OmnichannelMessageDirectionEnum;
    readonly external_id: string;
    readonly sender_id: string;
    readonly recipient_id: string;
    readonly text: string;
    readonly status: string;
    readonly queue_state: string;
    readonly sla_deadline_at: string | null;
    readonly responded_at: string | null;
    readonly subject_content_type: number | null;
    readonly subject_object_id: number | null;
    readonly created_at: string;
};

