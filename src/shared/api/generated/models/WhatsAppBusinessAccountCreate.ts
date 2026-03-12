/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type WhatsAppBusinessAccountCreate = {
    readonly id: string;
    business_name: string;
    phone_number?: string;
    phone_number_id: string;
    business_account_id?: string;
    access_token: string;
    app_secret?: string;
    verify_token?: string;
    is_active?: boolean;
    auto_sync_messages?: boolean;
    auto_create_leads?: boolean;
    webhook_url?: string;
};

