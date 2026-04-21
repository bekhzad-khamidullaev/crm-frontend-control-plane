/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PatchedUser = {
    readonly id?: number;
    /**
     * Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.
     */
    username?: string;
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
    readonly groups?: Array<string>;
    readonly roles?: Array<string>;
    readonly permissions?: Array<string>;
    readonly direct_permissions?: Array<string>;
};

