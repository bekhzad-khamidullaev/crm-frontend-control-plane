/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for CrmEmail model
 */
export type PatchedCrmEmail = {
    readonly id?: number;
    owner?: number | null;
    readonly owner_name?: string | null;
    company?: number | null;
    readonly company_name?: string | null;
    contact?: number | null;
    readonly contact_name?: string | null;
    deal?: number | null;
    readonly deal_name?: string | null;
    request?: number | null;
    lead?: number | null;
    /**
     * The Email address of sender
     */
    from_field?: string | null;
    /**
     * You can specify multiple addresses, separated by commas
     */
    to?: string | null;
    /**
     * The subject of the message. You can use {{first_name}}, {{last_name}}, {{first_middle_name}} or {{full_name}}
     */
    subject?: string;
    message_id?: string;
    content?: string;
    incoming?: boolean;
    sent?: boolean;
    readonly creation_date?: string;
};

