// @ts-ignore
import { getLocale } from '@/lib/i18n';

type SupportedLocale = 'ru' | 'en' | 'uz';

const LEAD_SOURCE_LABELS: Record<SupportedLocale, Record<string, string>> = {
  en: {
    website: 'Website',
    'web site': 'Website',
    'веб-сайт': 'Website',
    сайт: 'Website',
    'instagram direct': 'Instagram Direct',
    instagram: 'Instagram',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    'inbound phone': 'Inbound Phone',
    'inbound call': 'Inbound Phone',
    'incoming call': 'Inbound Phone',
    'входящий звонок': 'Inbound Phone',
    "kiruvchi qo'ng'iroq": 'Inbound Phone',
    'outbound phone': 'Outbound Phone',
    'outbound call': 'Outbound Phone',
    'outgoing call': 'Outbound Phone',
    'исходящий звонок': 'Outbound Phone',
    "chiquvchi qo'ng'iroq": 'Outbound Phone',
    distributor: 'Distributor',
    'дистрибьютор': 'Distributor',
    distribyutor: 'Distributor',
    exhibition: 'Exhibition',
    'выставка': 'Exhibition',
    "ko'rgazma": 'Exhibition',
    referral: 'Referral',
    'рекомендация': 'Referral',
    tavsiya: 'Referral',
  },
  ru: {
    website: 'Веб-сайт',
    'web site': 'Веб-сайт',
    "veb-sayt": 'Веб-сайт',
    'instagram direct': 'Instagram Direct',
    instagram: 'Instagram',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    'inbound phone': 'Входящий звонок',
    'inbound call': 'Входящий звонок',
    'incoming call': 'Входящий звонок',
    'outbound phone': 'Исходящий звонок',
    'outbound call': 'Исходящий звонок',
    'outgoing call': 'Исходящий звонок',
    distributor: 'Дистрибьютор',
    distribyutor: 'Дистрибьютор',
    exhibition: 'Выставка',
    "ko'rgazma": 'Выставка',
    referral: 'Рекомендация',
    tavsiya: 'Рекомендация',
  },
  uz: {
    website: 'Veb-sayt',
    'web site': 'Veb-sayt',
    'веб-сайт': 'Veb-sayt',
    сайт: 'Veb-sayt',
    'instagram direct': 'Instagram Direct',
    instagram: 'Instagram',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    'inbound phone': "Kiruvchi qo'ng'iroq",
    'inbound call': "Kiruvchi qo'ng'iroq",
    'incoming call': "Kiruvchi qo'ng'iroq",
    'outbound phone': "Chiquvchi qo'ng'iroq",
    'outbound call': "Chiquvchi qo'ng'iroq",
    'outgoing call': "Chiquvchi qo'ng'iroq",
    distributor: 'Distribyutor',
    'дистрибьютор': 'Distribyutor',
    exhibition: 'Ko‘rgazma',
    'выставка': 'Ko‘rgazma',
    referral: 'Tavsiya',
    'рекомендация': 'Tavsiya',
  },
};

function normalizeSourceName(name: string) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function getLeadSourceLabel(name?: string | null, locale?: string): string {
  if (!name) return '';

  const normalizedLocale = (locale || getLocale() || 'en').toLowerCase();
  const lang: SupportedLocale = normalizedLocale === 'ru' || normalizedLocale === 'uz'
    ? normalizedLocale
    : 'en';

  const normalizedName = normalizeSourceName(name);
  return LEAD_SOURCE_LABELS[lang][normalizedName] || name;
}
