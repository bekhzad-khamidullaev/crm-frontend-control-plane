import enCatalog from '../../locales/en.json';
import ruCatalog from '../../locales/ru.json';
import uzCatalog from '../../locales/uz.json';

// Keep catalogs eagerly loaded to avoid rendering raw translation keys.
const catalogs = {
  en: enCatalog,
  ru: ruCatalog,
  uz: uzCatalog,
};
const DEFAULT_LOCALE = 'ru';

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

export async function setLocale(locale) {
  const normalizedLocale = normalizeLocale(locale);
  current = catalogs[normalizedLocale] ? normalizedLocale : DEFAULT_LOCALE;
  document.documentElement.lang = current;
}

export function t(key, vars = {}) {
  const dict = catalogs[current] || {};
  let str = (key.split('.').reduce((o, k) => (o ? o[k] : undefined), dict)) || key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`{${k}}`, 'g'), v);
  }
  return str;
}

export function getLocale() { return current; }

export default { setLocale, t, getLocale };
