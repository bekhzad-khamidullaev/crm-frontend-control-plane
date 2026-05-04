/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FormatEnum } from './FormatEnum';
import type { MeetingStatusEnum } from './MeetingStatusEnum';
export type Meeting = {
    readonly id: number;
    subject: string;
    description?: string;
    start_at: string;
    end_at?: string | null;
    status?: MeetingStatusEnum;
    format?: FormatEnum;
    location?: string;
    attendees?: string;
    outcome?: string;
    company?: number | null;
    readonly company_name: string | null;
    contact?: number | null;
    readonly contact_name: string | null;
    deal?: number | null;
    readonly deal_name: string | null;
    owner?: number | null;
    readonly creation_date: string;
    readonly update_date: string;
};

