/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type InternalNumberOption = {
    readonly id: number;
    user?: number | null;
    readonly user_name: string;
    server?: number | null;
    /**
     * Internal extension number (e.g., 1001, 2005)
     */
    number: string;
    /**
     * Name to display in calls
     */
    display_name?: string;
    readonly sip_uri: string;
    active?: boolean;
    readonly status: string;
    readonly warnings: Array<string>;
};

