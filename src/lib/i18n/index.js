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

function applyTemplateVars(template, vars) {
  let result = template;
  for (const [name, value] of Object.entries(vars || {})) {
    result = result.replaceAll(`{${name}}`, String(value));
  }
  return result;
}

export function t(key, vars = {}) {
  const dict = catalogs[current] || {};
  const translated = key.split('.').reduce((obj, part) => (obj ? obj[part] : undefined), dict);

  if (typeof vars === 'string') {
    return typeof translated === 'string' ? translated : vars;
  }

  return applyTemplateVars(typeof translated === 'string' ? translated : key, vars);
}

export function getLocale() { return current; }

export default { setLocale, t, getLocale };
