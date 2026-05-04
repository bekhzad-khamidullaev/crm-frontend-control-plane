/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PatchedWhatsAppBusinessAccount = {
    readonly id?: string;
    business_name?: string;
    phone_number?: string;
    phone_number_id?: string;
    business_account_id?: string;
    is_active?: boolean;
    auto_sync_messages?: boolean;
    auto_create_leads?: boolean;
    webhook_url?: string;
    readonly messages_received?: number;
    readonly messages_sent?: number;
    readonly last_activity_at?: string | null;
    readonly connected_by_username?: string;
    readonly created_at?: string;
    readonly updated_at?: string;
};

