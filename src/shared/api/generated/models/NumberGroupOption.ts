/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DistributionStrategyEnum } from './DistributionStrategyEnum';
export type NumberGroupOption = {
    readonly id: number;
    /**
     * Display name for this group (e.g., Sales, Support, Management)
     */
    name: string;
    /**
     * Description of this group's purpose
     */
    description?: string;
    /**
     * How calls are distributed among group members
     *
     * * `round_robin` - Round Robin
     * * `random` - Random
     * * `priority` - Priority Order
     * * `all_ring` - Ring All
     * * `least_recent` - Least Recently Called
     */
    distribution_strategy?: DistributionStrategyEnum;
    readonly member_count: string;
    active?: boolean;
};

