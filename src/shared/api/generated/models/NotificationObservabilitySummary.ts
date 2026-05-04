/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { NotificationObservabilityMetric } from './NotificationObservabilityMetric';
import type { NotificationObservabilityStatusBreakdown } from './NotificationObservabilityStatusBreakdown';
export type NotificationObservabilitySummary = {
    window_hours: number;
    metrics: Record<string, NotificationObservabilityMetric>;
    status_breakdown: Array<NotificationObservabilityStatusBreakdown>;
};

