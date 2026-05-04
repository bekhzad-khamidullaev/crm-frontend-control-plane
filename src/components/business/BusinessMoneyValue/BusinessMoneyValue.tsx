import { APP_LOCALE, formatCurrency } from '../../../lib/utils/format';
import type { BusinessMoneyValueProps } from './interface';
import './index.css';

function normalizeNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const parsed = Number(String(raw).trim().replace(/\s+/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPlain(value: number, precision: number): string {
  return new Intl.NumberFormat(APP_LOCALE, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export default function BusinessMoneyValue({
  value,
  currencyCode,
  precision = 2,
  fallback = '—',
  showSign = false,
  negativeClassName = 'component_BusinessMoneyValue_negative',
  className = '',
}: BusinessMoneyValueProps) {
  const normalized = normalizeNumber(value);
  if (normalized === null) {
    return <span className={`component_BusinessMoneyValue_root ${className}`.trim()}>{fallback}</span>;
  }

  const signedValue = showSign && normalized > 0 ? `+${formatPlain(normalized, precision)}` : null;
  const formatted = currencyCode
    ? formatCurrency(normalized, currencyCode)
    : (signedValue || formatPlain(normalized, precision));
  const isNegative = normalized < 0;

  return (
    <span
      className={[
        'component_BusinessMoneyValue_root',
        className,
        isNegative ? negativeClassName : '',
      ].filter(Boolean).join(' ')}
    >
      {formatted}
    </span>
  );
}
