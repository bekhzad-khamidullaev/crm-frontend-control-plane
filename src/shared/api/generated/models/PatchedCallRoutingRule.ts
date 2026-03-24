/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CallRoutingRuleActionEnum } from './CallRoutingRuleActionEnum';
export type PatchedCallRoutingRule = {
    readonly id?: number;
    name?: string;
    description?: string;
    /**
     * Lower number = higher priority
     */
    priority?: number;
    /**
     * Regex pattern for caller ID (e.g., ^\+7, ^8800)
     */
    caller_id_pattern?: string;
    /**
     * Regex pattern for called number
     */
    called_number_pattern?: string;
    /**
     * Time condition (e.g., weekdays 09:00-18:00)
     */
    time_condition?: string;
    action?: CallRoutingRuleActionEnum;
    /**
     * Target internal number for routing
     */
    target_number?: number | null;
    readonly target_number_display?: string;
    /**
     * Target group for routing
     */
    target_group?: number | null;
    readonly target_group_name?: string;
    /**
     * External number for forwarding
     */
    target_external?: string;
    /**
     * Text to play as announcement
     */
    announcement_text?: string;
    active?: boolean;
    readonly created_at?: string;
    readonly updated_at?: string;
};

