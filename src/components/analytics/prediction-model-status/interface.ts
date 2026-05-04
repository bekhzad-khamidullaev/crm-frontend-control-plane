export interface PredictionModelRun {
  series_key: string;
  status: string;
  model_key: string;
  model_label: string;
  model_source: string;
  horizon_days: number;
  mae: number | null;
  rmse: number | null;
  mape: number | null;
  validation_points: number | null;
  completed_at: string | null;
}

export interface PredictionModelStatusProps {
  runs: PredictionModelRun[];
  loading?: boolean;
  emptyText?: string;
}
