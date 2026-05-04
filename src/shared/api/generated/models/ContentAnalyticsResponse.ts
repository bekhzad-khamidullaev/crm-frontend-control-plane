/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ContentAnalyticsResponse = {
    total: number;
    overdue: number;
    published: number;
    scheduled: number;
    by_stage: Record<string, number>;
    on_time_publish_rate: number;
    lead_time_hours_avg: number;
    approval_cycle_hours_avg: number;
    failure_rate_by_channel: Record<string, number>;
    throughput_per_week: Record<string, number>;
};

