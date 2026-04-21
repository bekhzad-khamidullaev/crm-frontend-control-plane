/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Serializer for UserProfile model
 */
export type PatchedUserProfile = {
    readonly user?: number;
    readonly username?: string;
    email?: string;
    full_name?: string;
    /**
     * User profile picture (max 5MB)
     */
    readonly avatar?: string | null;
    readonly avatar_url?: string | null;
    pbx_number?: string;
    utc_timezone?: string;
    activate_timezone?: boolean;
    language_code?: string;
};

