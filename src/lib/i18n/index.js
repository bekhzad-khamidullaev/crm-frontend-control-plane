// Minimal i18n service with async locale loading (static map to satisfy Vite)
const catalogs = {};
let current = 'en';

const loaders = {
  en: () => import('../../locales/en.json').then((m) => m.default || m),
  ru: () => import('../../locales/ru.json').then((m) => m.default || m),
};

export async function setLocale(locale) {
  const loader = loaders[locale] || loaders.en;
  if (!catalogs[locale]) {
    catalogs[locale] = await loader();
  }
  current = loaders[locale] ? locale : 'en';
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
