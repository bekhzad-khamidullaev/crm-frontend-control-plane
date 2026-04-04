/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SeatUsage } from './SeatUsage';
export type LicenseEntitlements = {
    installed: boolean;
    status: string;
    health_reason?: string;
    license_id?: string;
    customer_name?: string;
    plan_code?: string;
    edition_code?: string;
    edition_name?: string;
    install_profile_code?: string;
    install_profile_name?: string;
    feature_catalog_version?: string;
    valid_from?: string | null;
    valid_to?: string | null;
    grace_until?: string | null;
    installed_at?: string | null;
    features?: Array<string>;
    limits?: Record<string, any>;
    feature_catalog?: Array<Record<string, any>>;
    max_active_users?: number | null;
    active_users_count?: number;
    over_limit?: boolean;
    seat_usage: SeatUsage;
    instance_id?: string;
    last_validation_at?: string | null;
    last_heartbeat_at?: string | null;
    heartbeat_fail_count?: number;
    tamper_detected_at?: string | null;
    source?: string;
    enforcement_mode?: string;
};

