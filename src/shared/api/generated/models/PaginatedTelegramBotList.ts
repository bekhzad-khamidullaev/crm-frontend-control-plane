/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TelegramBot } from './TelegramBot';
export type PaginatedTelegramBotList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<TelegramBot>;
};

