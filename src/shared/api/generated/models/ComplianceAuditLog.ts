/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryEnum } from './CategoryEnum';
export type ComplianceAuditLog = {
    readonly id: number;
    category: CategoryEnum;
    action: string;
    status?: string;
    details?: any;
    readonly actor: number | null;
    readonly actor_username: string;
    readonly created_at: string;
};

