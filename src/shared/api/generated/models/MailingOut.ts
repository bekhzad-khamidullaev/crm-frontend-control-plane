/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MailingOutStatusEnum } from './MailingOutStatusEnum';
export type MailingOut = {
    readonly id: number;
    /**
     * The name of the message.
     */
    name: string;
    owner?: number | null;
    readonly owner_name: string;
    message?: number | null;
    readonly message_name: string;
    sending_date?: string | null;
    status?: MailingOutStatusEnum;
    /**
     * Number of recipients
     */
    recipients_number: number;
    readonly creation_date: string;
};

