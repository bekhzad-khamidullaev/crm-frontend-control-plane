import { t } from '@/lib/i18n';

const REJECTED_STAGE_MATCH = /(отказ|проиг|потер|неусп|lost|reject|cancel|closed\s*lost|declined)/i;
const REJECTED_STATUS_MATCH = /(lost|rejected|cancelled|canceled|closed_lost|declined)/i;

type DealLike = {
  stage_name?: unknown;
  status?: unknown;
  closing_reason?: unknown;
  active?: unknown;
  relevant?: unknown;
  closing_date?: unknown;
  win_closing_date?: unknown;
};

type TranslateFn = (key: string) => string;

export const toNumberSafe = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const isDealRejected = (deal: DealLike) => {
  const stageName = String(deal?.stage_name || '');
  const status = String(deal?.status || '');
  const hasClosingReason = Boolean(deal?.closing_reason);
  const inactiveClosed =
    (deal?.active === false || deal?.relevant === false)
    && Boolean(deal?.closing_date || deal?.win_closing_date);

  return hasClosingReason || REJECTED_STAGE_MATCH.test(stageName) || REJECTED_STATUS_MATCH.test(status) || inactiveClosed;
};

export const getRejectedReason = (deal: DealLike, tr?: TranslateFn) => {
  const translate = tr ?? t;
  const stageName = String(deal?.stage_name || '');
  const status = String(deal?.status || '');

  if (deal?.closing_reason) {
    return `${translate('dealsRejections.reasonPrefix')} #${deal.closing_reason}`;
  }
  if (REJECTED_STAGE_MATCH.test(stageName)) {
    return stageName;
  }
  if (REJECTED_STATUS_MATCH.test(status)) {
    return status;
  }
  return translate('dealsRejections.reasonNotSpecified');
};
