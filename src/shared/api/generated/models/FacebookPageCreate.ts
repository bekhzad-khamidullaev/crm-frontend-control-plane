/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating Facebook Page with OAuth.
 */
export type FacebookPageCreate = {
    readonly id: string;
    facebook_page_id: string;
    page_name: string;
    page_category?: string;
    access_token: string;
    token_expires_at?: string | null;
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
    /**
     * List of granted Facebook permissions
     */
    granted_permissions?: any;
};

