/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EmailDigestFrequencyEnum } from './EmailDigestFrequencyEnum';
/**
 * Serializer for notification settings.
 */
export type PatchedNotificationSettings = {
    readonly id?: number;
    /**
     * Leave blank for global settings
     */
    user?: number | null;
    notify_new_leads?: boolean;
    notify_missed_calls?: boolean;
    push_notifications?: boolean;
    notify_task_assigned?: boolean;
    notify_deal_won?: boolean;
    notify_message_received?: boolean;
    email_digest_frequency?: EmailDigestFrequencyEnum;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    /**
     * Return notification channels as a dict.
     */
    readonly notification_channels?: Record<string, boolean>;
};

