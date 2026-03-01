/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for creating Instagram Account with OAuth.
 */
export type InstagramAccountCreate = {
    readonly id: string;
    instagram_user_id: string;
    username: string;
    access_token: string;
    token_expires_at?: string | null;
    facebook_page_id?: string;
    facebook_page_name?: string;
    /**
     * Automatically sync Instagram Direct messages
     */
    auto_sync_messages?: boolean;
    /**
     * Automatically sync post comments
     */
    auto_sync_comments?: boolean;
};

