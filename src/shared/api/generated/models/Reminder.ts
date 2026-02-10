/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Reminder model
 */
export type Reminder = {
    readonly id: number;
    owner?: number | null;
    readonly owner_name: string;
    /**
     * Briefly, what is this reminder about?
     */
    subject: string;
    description?: string;
    reminder_date: string;
    send_notification_email?: boolean;
    active?: boolean;
    readonly creation_date: string;
    content_type: number;
    object_id: number;
};

