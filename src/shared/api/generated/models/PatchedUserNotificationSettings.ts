/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DigestFrequencyEnum } from './DigestFrequencyEnum';
export type PatchedUserNotificationSettings = {
    channel_settings?: any;
    event_settings?: any;
    quiet_hours_start?: string;
    quiet_hours_end?: string;
    digest_frequency?: DigestFrequencyEnum;
    timezone?: string;
    readonly updated_at?: string;
};

