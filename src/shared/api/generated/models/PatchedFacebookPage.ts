/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for Facebook Page.
 */
export type PatchedFacebookPage = {
    readonly id?: string;
    facebook_page_id?: string;
    page_name?: string;
    page_category?: string;
    is_active?: boolean;
    /**
     * Automatically sync Messenger messages
     */
    auto_sync_messages?: boolean;
    /**
     * Automatically sync post comments
     */
    auto_sync_comments?: boolean;
    /**
     * Automatically sync page posts
     */
    auto_sync_posts?: boolean;
    webhook_url?: string;
    readonly messages_synced?: number;
    readonly comments_synced?: number;
    readonly posts_synced?: number;
    readonly last_sync_at?: string | null;
    page_url?: string;
    profile_picture_url?: string;
    readonly followers_count?: number;
    /**
     * List of granted Facebook permissions
     */
    granted_permissions?: any;
    readonly connected_by_username?: string;
    readonly is_token_valid?: string;
    readonly created_at?: string;
    readonly updated_at?: string;
};

