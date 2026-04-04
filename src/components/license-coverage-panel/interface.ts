export interface LicenseCoverageEntry {
  surface?: string;
  basename: string;
  prefix: string;
  viewset: string;
  status: string;
  feature?: string;
  middleware_feature?: string;
  permission_classes?: string[];
  reason?: string;
}

export interface LicenseCoverageSummary {
  generated_at?: string;
  totals?: {
    total?: number;
    covered?: number;
    exempt?: number;
    missing_permission?: number;
    missing_feature?: number;
    mismatched_feature?: number;
  };
  entries?: LicenseCoverageEntry[];
}

export interface LicenseCoveragePanelProps {
  summary?: LicenseCoverageSummary | null;
  loading?: boolean;
  error?: Error | null;
}
