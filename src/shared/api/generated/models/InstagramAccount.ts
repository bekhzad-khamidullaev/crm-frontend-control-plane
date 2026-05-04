/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Instagram Account.
 */
export type InstagramAccount = {
    readonly id: string;
    instagram_user_id: string;
    username: string;
    account_type?: string;
    facebook_page_id?: string;
    facebook_page_name?: string;
    is_active?: boolean;
    /**
     * Automatically sync Instagram Direct messages
     */
    auto_sync_messages?: boolean;
    /**
     * Automatically sync post comments
     */
    auto_sync_comments?: boolean;
    webhook_url?: string;
    readonly webhook_verify_token: string;
    readonly messages_synced: number;
    readonly comments_synced: number;
    readonly last_sync_at: string | null;
    profile_picture_url?: string;
    readonly followers_count: number;
    readonly media_count: number;
    app_secret?: string;
    readonly connected_by_username: string;
    /**
     * Check if token is still valid.
     */
    readonly is_token_valid: boolean;
    readonly created_at: string;
    readonly updated_at: string;
};

