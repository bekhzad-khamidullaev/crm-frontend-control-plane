/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Telegram Bot.
 */
export type TelegramBot = {
    readonly id: string;
    readonly bot_username: string;
    readonly bot_name: string;
    is_active?: boolean;
    /**
     * Enable automatic replies
     */
    auto_reply?: boolean;
    /**
     * Use webhook instead of polling
     */
    use_webhook?: boolean;
    /**
     * Telegram webhook URL for receiving updates
     */
    webhook_url?: string;
    readonly messages_received: number;
    readonly messages_sent: number;
    readonly active_chats: number;
    readonly last_activity_at: string | null;
    /**
     * Welcome message for new users
     */
    welcome_message?: string;
    /**
     * Custom bot commands configuration
     */
    commands?: any;
    /**
     * List of allowed Telegram chat IDs
     */
    allowed_chat_ids?: any;
    readonly connected_by_username: string;
    readonly bot_info_url: string;
    readonly created_at: string;
    readonly updated_at: string;
};

