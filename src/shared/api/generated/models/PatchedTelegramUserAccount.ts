/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Telegram personal account.
 */
export type PatchedTelegramUserAccount = {
    readonly id?: string;
    /**
     * Telegram phone number in international format
     */
    phone_number?: string;
    /**
     * Telegram API ID from my.telegram.org
     */
    api_id?: string;
    api_hash?: string;
    readonly username?: string;
    readonly first_name?: string;
    readonly last_name?: string;
    is_active?: boolean;
    /**
     * True when session has been verified and can be reused
     */
    readonly is_verified?: boolean;
    /**
     * draft|code_sent|password_required|authorized
     */
    readonly auth_state?: string;
    readonly auth_requested_at?: string | null;
    readonly last_activity_at?: string | null;
    readonly connected_by_username?: string;
    readonly created_at?: string;
    readonly updated_at?: string;
};

