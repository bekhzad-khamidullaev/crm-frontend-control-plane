export interface LicenseOperationsCodeStat {
  code: string;
  count: number;
}

export interface LicenseOperationsFeatureStat {
  feature: string;
  count: number;
  top_code?: string;
}

export interface LicenseOperationsEndpointStat {
  path?: string;
  method?: string;
  count: number;
  top_code?: string;
}

export interface LicenseOperationsSurfaceStat {
  surface_type?: string;
  count: number;
  top_code?: string;
}

export interface LicenseOperationsRuntimeSurfaceStat {
  surface_type?: string;
  surface_name?: string;
  count: number;
  top_code?: string;
}

export interface LicenseOperationsTrendBucket {
  bucket_start: string;
  total: number;
  top_code?: string;
  codes?: LicenseOperationsCodeStat[];
}

export interface LicenseOperationsAlert {
  code: string;
  severity: string;
  title: string;
  description: string;
  metric?: string;
  feature?: string;
  related_code?: string;
  path?: string;
  method?: string;
  surface_type?: string;
  surface_name?: string;
}

export interface LicenseAuditDrilldown {
  action?: string;
  code?: string;
  correlationId?: string;
  feature?: string;
  path?: string;
  method?: string;
  surfaceType?: string;
  surfaceName?: string;
}

export interface LicenseOperationsSummary {
  source?: string;
  window_hours?: number;
  generated_at?: string;
  totals?: {
    total_denials?: number;
    unique_codes?: number;
    unique_features?: number;
    unique_correlations?: number;
  };
  by_code?: LicenseOperationsCodeStat[];
  by_feature?: LicenseOperationsFeatureStat[];
  by_endpoint?: LicenseOperationsEndpointStat[];
  by_surface?: LicenseOperationsSurfaceStat[];
  by_runtime_surface?: LicenseOperationsRuntimeSurfaceStat[];
  trend?: LicenseOperationsTrendBucket[];
  alerts?: LicenseOperationsAlert[];
}

export interface LicenseOperationsPanelProps {
  summary?: LicenseOperationsSummary | null;
  loading?: boolean;
  error?: Error | null;
  onOpenAudit?: (filters: LicenseAuditDrilldown) => void;
}
