/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type VoipRoutingPreview = {
    caller_id: string;
    called_number?: string;
    route_mode: string;
    provider: string;
    decision: string;
    reason: string;
    target_extension: string;
    default_extension: string;
    fallback_extension: string;
    matched_type: string;
    matched_object_id: number | null;
    owner_user_id: number | null;
    owner_username: string;
    owner_sip_status: string;
    should_reroute: boolean;
};

