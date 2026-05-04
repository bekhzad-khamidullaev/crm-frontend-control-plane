/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating Telegram Bot.
 */
export type TelegramBotCreate = {
    readonly id: string;
    bot_token: string;
    readonly bot_username: string;
    readonly bot_name: string;
    /**
     * Welcome message for new users
     */
    welcome_message?: string;
    /**
     * Custom bot commands configuration
     */
    commands?: any;
    /**
     * Telegram webhook URL for receiving updates
     */
    webhook_url?: string;
    /**
     * Enable automatic replies
     */
    auto_reply?: boolean;
    /**
     * Use webhook instead of polling
     */
    use_webhook?: boolean;
    /**
     * List of allowed Telegram chat IDs
     */
    allowed_chat_ids?: any;
};

