export function setLocale(locale: string): Promise<void>;
export function t(key: string, vars?: Record<string, string | number> | string): string;
export function getLocale(): string;

declare const _default: {
  setLocale: typeof setLocale;
  t: typeof t;
  getLocale: typeof getLocale;
};

export default _default;
