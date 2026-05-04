import enCatalog from '../../locales/en.json';
import ruCatalog from '../../locales/ru.json';
import uzCatalog from '../../locales/uz.json';
import legacyContent from '../../locales/legacy-content.json';

// Keep catalogs eagerly loaded to avoid rendering raw translation keys.
const catalogs = {
  en: enCatalog,
  ru: ruCatalog,
  uz: uzCatalog,
};
const DEFAULT_LOCALE = 'ru';
const hasCyrillic = /[А-Яа-яЁё]/;
const hasLatin = /[A-Za-z]/;
const localePhraseCaches = new Map();

const fallbackWordMaps = {
  ru: {
    User: 'Пользователь',
    'Call details': 'Детали звонка',
    Count: 'Количество',
    Amount: 'Сумма',
    request: 'запрос',
    'analysis of request': 'анализ запроса',
    'clarification of the requirements': 'уточнение требований',
    'price offer': 'ценовое предложение',
    'commercial proposal': 'коммерческое предложение',
    'commercial offer': 'коммерческий оффер',
    agreement: 'договор',
    invoice: 'инвойс',
    'receiving the first payment': 'получение первого платежа',
    shipment: 'отгрузка',
    'closed (successful)': 'успешно закрыто',
    completed: 'завершено',
    canceled: 'отменено',
    cancelled: 'отменено',
    inbound: 'входящий',
    outbound: 'исходящий',
    Failed: 'Ошибка',
  },
  uz: {
    User: 'Foydalanuvchi',
    'Call details': "Qo'ng'iroq tafsilotlari",
    Count: 'Soni',
    Amount: 'Summa',
    request: "so'rov",
    'analysis of request': "so'rov tahlili",
    'clarification of the requirements': 'talablarni aniqlashtirish',
    'price offer': 'narx taklifi',
    'commercial proposal': 'tijorat taklifi',
    'commercial offer': 'tijoriy offer',
    agreement: 'shartnoma',
    invoice: 'hisob-faktura',
    'receiving the first payment': "birinchi to'lovni olish",
    shipment: 'yetkazib berish',
    'closed (successful)': 'muvaffaqiyatli yopildi',
    completed: 'yakunlandi',
    canceled: 'bekor qilindi',
    cancelled: 'bekor qilindi',
    inbound: 'kiruvchi',
    outbound: 'chiquvchi',
    Failed: 'Xato',
  },
  en: {
    Пользователь: 'User',
  },
};

function normalizeLocale(raw) {
  const value = String(raw || '').toLowerCase();
  if (value.startsWith('uz')) return 'uz';
  if (value.startsWith('en')) return 'en';
  return 'ru';
}

function detectInitialLocale() {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const enterpriseLocale = localStorage.getItem('enterprise_crm_locale');
    if (enterpriseLocale) return normalizeLocale(enterpriseLocale);

    const legacyLocale = localStorage.getItem('locale');
    if (legacyLocale) {
      const normalized = normalizeLocale(legacyLocale);
      localStorage.setItem('enterprise_crm_locale', normalized);
      return normalized;
    }

    return DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

let current = detectInitialLocale();

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceTokenAware(text, source, target) {
  if (!text || !source || source === target) return text;

  const isSingleToken = /^[\p{L}\p{N}_-]+$/u.test(source);
  if (isSingleToken) {
    const pattern = new RegExp(
      `(^|[^\\p{L}\\p{N}_])(${escapeRegExp(source)})(?=$|[^\\p{L}\\p{N}_])`,
      'gu'
    );
    return text.replace(pattern, `$1${target}`);
  }
  return text.split(source).join(target);
}

function getLocaleEntries(locale) {
  const normalizedLocale = String(locale || DEFAULT_LOCALE).toLowerCase();
  const cached = localePhraseCaches.get(normalizedLocale);
  if (cached) return cached;

  const ruToEn = legacyContent.en || {};
  const ruToUz = legacyContent.uz || {};
  const ruPhrases = new Set([...Object.keys(ruToEn), ...Object.keys(ruToUz)]);
  const dictionary = new Map();

  const addPair = (source, target) => {
    if (!source || !target || source === target) return;
    if (String(source).trim().length < 2) return;
    dictionary.set(source, target);
  };

  for (const ruPhrase of ruPhrases) {
    const enPhrase = ruToEn[ruPhrase];
    const uzPhrase = ruToUz[ruPhrase];
    if (normalizedLocale === 'en') {
      addPair(ruPhrase, enPhrase);
      addPair(uzPhrase, enPhrase);
      continue;
    }
    if (normalizedLocale === 'uz') {
      addPair(ruPhrase, uzPhrase);
      addPair(enPhrase, uzPhrase);
      continue;
    }
    addPair(enPhrase, ruPhrase);
    addPair(uzPhrase, ruPhrase);
  }

  const extraWords = fallbackWordMaps[normalizedLocale] || {};
  for (const [source, target] of Object.entries(extraWords)) {
    addPair(source, target);
  }

  const entries = Array.from(dictionary.entries()).sort((a, b) => b[0].length - a[0].length);
  localePhraseCaches.set(normalizedLocale, entries);
  return entries;
}

function localizeMixedText(value, locale) {
  if (!value) return value;
  const entries = getLocaleEntries(locale);
  if (!entries.length) return value;

  const exact = entries.find(([source]) => source === value);
  if (exact) return exact[1];

  let next = String(value);
  for (const [source, target] of entries) {
    if (!next.includes(source)) continue;
    next = replaceTokenAware(next, source, target);
  }
  return next;
}

export async function setLocale(locale) {
  const normalizedLocale = normalizeLocale(locale);
  current = catalogs[normalizedLocale] ? normalizedLocale : DEFAULT_LOCALE;
  document.documentElement.lang = current;
}

function applyTemplateVars(template, vars) {
  let result = template;
  for (const [name, value] of Object.entries(vars || {})) {
    result = result.replaceAll(`{${name}}`, String(value));
  }
  return result;
}

export function t(key, vars = {}) {
  const dict = catalogs[current] || {};
  const enDict = catalogs.en || {};
  const translated = key.split('.').reduce((obj, part) => (obj ? obj[part] : undefined), dict);
  const translatedEn = key.split('.').reduce((obj, part) => (obj ? obj[part] : undefined), enDict);

  if (typeof vars === 'string') {
    return typeof translated === 'string' ? translated : vars;
  }

  let resolved = typeof translated === 'string' ? translated : key;
  if (typeof resolved === 'string') {
    const shouldNormalize =
      (current === 'ru' && hasLatin.test(resolved)) ||
      (current === 'uz' && hasLatin.test(resolved)) ||
      (current === 'en' && hasCyrillic.test(resolved)) ||
      (current !== 'en' && typeof translatedEn === 'string' && resolved === translatedEn);

    if (shouldNormalize) {
      resolved = localizeMixedText(resolved, current);
    }
  }

  return applyTemplateVars(resolved, vars);
}

export function getLocale() { return current; }

export default { setLocale, t, getLocale };
