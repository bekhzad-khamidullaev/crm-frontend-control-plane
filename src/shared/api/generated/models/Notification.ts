/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationEventBrief } from './NotificationEventBrief';
import type { NotificationPriorityEnum } from './NotificationPriorityEnum';
import type { NotificationStatusEnum } from './NotificationStatusEnum';
export type Notification = {
    readonly id: number;
    readonly recipient: number;
    readonly event: NotificationEventBrief;
    readonly status: NotificationStatusEnum;
    readonly priority: NotificationPriorityEnum;
    readonly expires_at: string | null;
    readonly action_url: string;
    readonly metadata: any;
    readonly read_at: string | null;
    readonly archived_at: string | null;
    readonly created_at: string;
};

