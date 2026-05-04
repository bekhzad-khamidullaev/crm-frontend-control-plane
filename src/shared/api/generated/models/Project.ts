/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TaskPriorityEnum } from './TaskPriorityEnum';
/**
 * Mixin to add validation helpers to serializers
 */
export type Project = {
    readonly id: number;
    /**
     * Short title
     */
    name?: string;
    description?: string;
    note?: string;
    priority?: TaskPriorityEnum;
    start_date?: string | null;
    due_date?: string | null;
    closing_date?: string | null;
    /**
     * Describe briefly what needs to be done in the next step.
     */
    next_step: string;
    /**
     * Date to which the next step should be taken.
     */
    next_step_date: string;
    active?: boolean;
    remind_me?: boolean;
    stage?: number | null;
    owner?: number | null;
    co_owner?: number | null;
    responsible?: Array<number>;
    subscribers?: Array<number>;
    tags?: Array<number>;
    readonly workflow: string;
    readonly creation_date: string;
    readonly update_date: string;
    readonly token: string;
};

