import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'enterprise_crm-theme';
const EVENT_KEY = 'enterprise_crm-theme-change';
const THEME_VARIABLES = {
  light: {
    '--crm-app-body-bg': '#f0f2f5',
    '--crm-app-body-bg-alt': '#e8edf4',
    '--crm-app-surface': 'rgba(255, 255, 255, 0.94)',
    '--crm-app-surface-solid': '#ffffff',
    '--crm-app-surface-elevated': '#ffffff',
    '--crm-app-border': '#e2e8f0',
    '--crm-app-border-strong': '#b9c6d8',
    '--crm-app-border-soft': 'rgba(100, 116, 139, 0.22)',
    '--crm-app-text': '#0f172a',
    '--crm-app-text-muted': '#475569',
    '--crm-app-menu-selected': '#dbeafe',
    '--crm-app-menu-hover': '#f8fafc',
    '--crm-app-shadow': '0 12px 30px rgba(15, 23, 42, 0.08)',
    '--crm-app-shadow-strong': '0 18px 40px rgba(15, 23, 42, 0.12)',
    '--crm-app-accent-glow': 'rgba(59, 130, 246, 0.1)',
    '--crm-app-surface-glow': 'rgba(255, 255, 255, 0.72)',
    '--crm-app-selection': 'rgba(37, 99, 235, 0.18)',
  },
  dark: {
    '--crm-app-body-bg': '#08111f',
    '--crm-app-body-bg-alt': '#0f172a',
    '--crm-app-surface': 'rgba(12, 19, 32, 0.94)',
    '--crm-app-surface-solid': '#0c1523',
    '--crm-app-surface-elevated': '#18263b',
    '--crm-app-border': 'rgba(148, 163, 184, 0.28)',
    '--crm-app-border-strong': 'rgba(226, 232, 240, 0.46)',
    '--crm-app-border-soft': 'rgba(148, 163, 184, 0.26)',
    '--crm-app-text': '#f8fbff',
    '--crm-app-text-muted': '#cad6e2',
    '--crm-app-menu-selected':
      'linear-gradient(135deg, rgba(125, 211, 252, 0.3), rgba(96, 165, 250, 0.18))',
    '--crm-app-menu-hover': 'rgba(148, 163, 184, 0.14)',
    '--crm-app-shadow': '0 18px 40px rgba(2, 6, 23, 0.42)',
    '--crm-app-shadow-strong': '0 24px 52px rgba(2, 6, 23, 0.58)',
    '--crm-app-accent-glow': 'rgba(56, 189, 248, 0.16)',
    '--crm-app-surface-glow': 'rgba(255, 255, 255, 0.11)',
    '--crm-app-selection': 'rgba(125, 211, 252, 0.36)',
  },
};

function applyThemeVariables(theme) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const nextVariables = THEME_VARIABLES[theme] || THEME_VARIABLES.light;

  Object.entries(nextVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

let globalTheme = getInitialTheme();

export function useTheme() {
  const [theme, setThemeState] = useState(globalTheme);

  useEffect(() => {
    // Apply initial classes once on mount
    const root = document.documentElement;
    if (globalTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    applyThemeVariables(globalTheme);

    const handleThemeChange = (e) => {
      setThemeState(e.detail);
    };

    window.addEventListener(EVENT_KEY, handleThemeChange);
    return () => window.removeEventListener(EVENT_KEY, handleThemeChange);
  }, []);

  const setTheme = useCallback((newThemeOrFn) => {
    setThemeState((prev) => {
      const nextTheme = typeof newThemeOrFn === 'function' ? newThemeOrFn(prev) : newThemeOrFn;
      if (nextTheme !== prev) {
        globalTheme = nextTheme;
        const root = document.documentElement;
        if (nextTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        applyThemeVariables(nextTheme);
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
        window.dispatchEvent(new window.CustomEvent(EVENT_KEY, { detail: nextTheme }));
      }
      return nextTheme;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
