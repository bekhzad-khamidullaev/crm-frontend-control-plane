/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating Telegram Bot.
 */
export type TelegramBotCreate = {
    bot_token: string;
    /**
     * Welcome message for new users
     */
    welcome_message?: string;
    /**
     * Custom bot commands configuration
     */
    commands?: any;
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

