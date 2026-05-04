export interface BusinessMoneyValueProps {
  value: number | string | null | undefined;
  currencyCode?: string | null;
  precision?: number;
  fallback?: string;
  showSign?: boolean;
  negativeClassName?: string;
  className?: string;
}

