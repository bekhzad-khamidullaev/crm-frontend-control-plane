import { getLocale, t } from '@/lib/i18n';

const normalize = (value: unknown) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const STAGE_NAME_KEY_BY_NORMALIZED: Record<string, string> = {
  request: 'dealsCommon.stages.request',
  запрос: 'dealsCommon.stages.request',
  "so'rov": 'dealsCommon.stages.request',
  sorov: 'dealsCommon.stages.request',
  'analysis of request': 'dealsCommon.stages.analysisOfRequest',
  'analysis request': 'dealsCommon.stages.analysisOfRequest',
  'анализ запроса': 'dealsCommon.stages.analysisOfRequest',
  'sorov tahlili': 'dealsCommon.stages.analysisOfRequest',
  "so'rov tahlili": 'dealsCommon.stages.analysisOfRequest',
  'clarification of the requirements': 'dealsCommon.stages.clarificationOfRequirements',
  'clarification requirements': 'dealsCommon.stages.clarificationOfRequirements',
  'уточнение требований': 'dealsCommon.stages.clarificationOfRequirements',
  'talablarni aniqlashtirish': 'dealsCommon.stages.clarificationOfRequirements',
  'price offer': 'dealsCommon.stages.priceOffer',
  'price proposal': 'dealsCommon.stages.priceOffer',
  'ценовое предложение': 'dealsCommon.stages.priceOffer',
  'narx taklifi': 'dealsCommon.stages.priceOffer',
  'commercial proposal': 'dealsCommon.stages.commercialProposal',
  'коммерческое предложение': 'dealsCommon.stages.commercialProposal',
  'tijorat taklifi': 'dealsCommon.stages.commercialProposal',
  'commercial offer': 'dealsCommon.stages.commercialOffer',
  'коммерческий оффер': 'dealsCommon.stages.commercialOffer',
  'commercial quote': 'dealsCommon.stages.commercialOffer',
  agreement: 'dealsCommon.stages.agreement',
  договор: 'dealsCommon.stages.agreement',
  shartnoma: 'dealsCommon.stages.agreement',
  invoice: 'dealsCommon.stages.invoice',
  инвойс: 'dealsCommon.stages.invoice',
  счет: 'dealsCommon.stages.invoice',
  'hisob faktura': 'dealsCommon.stages.invoice',
  'receiving the first payment': 'dealsCommon.stages.receivingFirstPayment',
  'first payment received': 'dealsCommon.stages.receivingFirstPayment',
  'получение первого платежа': 'dealsCommon.stages.receivingFirstPayment',
  "birinchi to'lovni olish": 'dealsCommon.stages.receivingFirstPayment',
  shipment: 'dealsCommon.stages.shipment',
  отгрузка: 'dealsCommon.stages.shipment',
  yetkazib: 'dealsCommon.stages.shipment',
  'closed (successful)': 'dealsCommon.stages.closedSuccessful',
  'closed successful': 'dealsCommon.stages.closedSuccessful',
  'успешно закрыто': 'dealsCommon.stages.closedSuccessful',
  'muvaffaqiyatli yopildi': 'dealsCommon.stages.closedSuccessful',
  'in progress': 'dealsCommon.stages.inProgress',
  'в работе': 'dealsCommon.stages.inProgress',
  jarayonda: 'dealsCommon.stages.inProgress',
  won: 'dealsCommon.stages.won',
  выиграна: 'dealsCommon.stages.won',
  yutildi: 'dealsCommon.stages.won',
  lost: 'dealsCommon.stages.lost',
  проиграна: 'dealsCommon.stages.lost',
  yutqazildi: 'dealsCommon.stages.lost',
  'closed lost': 'dealsCommon.stages.lost',
  rejected: 'dealsCommon.stages.rejected',
  отклонена: 'dealsCommon.stages.rejected',
  'rad etildi': 'dealsCommon.stages.rejected',
  declined: 'dealsCommon.stages.declined',
  decline: 'dealsCommon.stages.declined',
  cancelled: 'dealsCommon.stages.cancelled',
  canceled: 'dealsCommon.stages.cancelled',
  отменена: 'dealsCommon.stages.cancelled',
  'bekor qilindi': 'dealsCommon.stages.cancelled',
  completed: 'dealsCommon.stages.completed',
  завершена: 'dealsCommon.stages.completed',
  yakunlandi: 'dealsCommon.stages.completed',
};

const LOCALE_DATE_BY_I18N: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  uz: 'uz-UZ',
};

export const getLocaleDateCode = () => LOCALE_DATE_BY_I18N[getLocale()] || 'ru-RU';

export const formatDateByLocale = (value: string | Date | number | null | undefined) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(getLocaleDateCode());
};

export const translateDealStageName = (rawName: unknown) => {
  const source = String(rawName || '').trim();
  if (!source) return source;
  const key = STAGE_NAME_KEY_BY_NORMALIZED[normalize(source)];
  if (!key) return source;
  const localized = t(key);
  return localized === key ? source : localized;
};

export const getStageDisplayName = (stage: any) => {
  if (!stage) return '';
  const locale = getLocale();
  const localizedByField =
    stage?.[`name_${locale}`] ||
    stage?.name ||
    stage?.name_ru ||
    stage?.name_en ||
    stage?.name_uz ||
    '';
  return translateDealStageName(localizedByField);
};
