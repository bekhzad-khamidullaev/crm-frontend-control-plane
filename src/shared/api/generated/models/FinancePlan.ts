/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FinancePlanStatusEnum } from './FinancePlanStatusEnum';
export type FinancePlan = {
    readonly id: number;
    title: string;
    period_month: string;
    currency?: number | null;
    readonly currency_name: string | null;
    readonly currency_code: string | null;
    planned_income?: string;
    planned_expense?: string;
    actual_income?: string;
    actual_expense?: string;
    status?: FinancePlanStatusEnum;
    comment?: string;
    owner?: number | null;
    readonly creation_date: string;
    readonly update_date: string;
};

