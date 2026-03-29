/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EnvironmentEnum } from './EnvironmentEnum';
export type Deployment = {
    readonly id: number;
    customer: number;
    instance_id: string;
    domain?: string | null;
    environment?: EnvironmentEnum;
    notes?: string;
    readonly created_at: string;
};

