/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageTemplateChannelEnum } from './MessageTemplateChannelEnum';
import type { PublishStatusEnum } from './PublishStatusEnum';
export type ContentChannelVariant = {
    readonly id: number;
    item: number;
    channel: MessageTemplateChannelEnum;
    format?: string;
    body?: string;
    subject?: string;
    cta?: string;
    hashtags?: string;
    utm_payload?: any;
    locale?: string;
    publish_status?: PublishStatusEnum;
    external_post_id?: string;
    error_code?: string;
    error_message?: string;
    readonly created_at: string;
    readonly updated_at: string;
};

