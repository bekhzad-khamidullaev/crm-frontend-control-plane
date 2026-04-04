/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating Telegram personal account credentials.
 */
export type TelegramUserAccountCreate = {
    readonly id: string;
    /**
     * Telegram phone number in international format
     */
    phone_number: string;
    api_id?: string;
    api_hash?: string;
    session_string?: string;
    is_active?: boolean;
};

