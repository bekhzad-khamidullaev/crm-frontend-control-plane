/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationPriorityEnum } from './NotificationPriorityEnum';
import type { NullEnum } from './NullEnum';
export type NotificationIngest = {
    event_type: string;
    recipient_ids?: Array<number>;
    entity_type?: string;
    entity_id?: string;
    payload?: any;
    dedup_key?: string;
    channels?: Array<string>;
    priority?: (NotificationPriorityEnum | NullEnum) | null;
    action_url?: string;
};

