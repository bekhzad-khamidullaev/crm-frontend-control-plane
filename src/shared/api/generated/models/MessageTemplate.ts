/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChannelEnum } from './ChannelEnum';
export type MessageTemplate = {
    readonly id: number;
    name: string;
    channel?: ChannelEnum;
    locale?: string;
    subject?: string;
    body: string;
    readonly version: number;
    readonly updated_at: string;
};

