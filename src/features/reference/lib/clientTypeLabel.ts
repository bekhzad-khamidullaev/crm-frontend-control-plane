// @ts-ignore
import { getLocale } from '@/lib/i18n';

type SupportedLocale = 'ru' | 'en' | 'uz';

const CLIENT_TYPE_LABELS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    distributor: 'Distributor',
    dealer: 'Dealer',
    reseller: 'Reseller',
    'end customer': 'End Customer',
    competitor: 'Competitor',
  },
  ru: {
    distributor: 'Дистрибьютор',
    dealer: 'Дилер',
    reseller: 'Реселлер',
    'end customer': 'Конечный клиент',
    competitor: 'Конкурент',
  },
  uz: {
    distributor: 'Distribyutor',
    dealer: 'Diler',
    reseller: 'Reseller',
    'end customer': "Yakuniy mijoz",
    competitor: 'Raqobatchi',
  },
};

function normalizeTypeName(name: string) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function getClientTypeLabel(name?: string | null, locale?: string): string {
  if (!name) return '';

  const normalizedLocale = (locale || getLocale() || 'en').toLowerCase();
  const lang: SupportedLocale = normalizedLocale === 'ru' || normalizedLocale === 'uz'
    ? normalizedLocale
    : 'en';

  const normalizedName = normalizeTypeName(name);
  return CLIENT_TYPE_LABELS[lang][normalizedName] || name;
}
