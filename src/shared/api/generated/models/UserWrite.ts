/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserWrite = {
    readonly id: number;
    /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     */
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    /**
     * Designates whether the user can log into this admin site.
     */
    is_staff?: boolean;
    /**
     * Designates that this user has all permissions without explicitly assigning them.
     */
    is_superuser?: boolean;
    /**
     * List of Django group (department) names
     */
    groups?: Array<string>;
    /**
     * List of business roles: platform_admin | sales_manager | sales_rep | marketing_manager | support_agent | operations_manager | finance_manager | warehouse_manager | crm_analyst | read_only_auditor
     */
    roles?: Array<string>;
    /**
     * List of permissions in "app_label.codename" or unique "codename" format
     */
    permissions?: Array<string>;
    password?: string;
};

