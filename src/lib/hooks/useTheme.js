import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'enterprise_crm-theme';
const EVENT_KEY = 'enterprise_crm-theme-change';
const THEME_VARIABLES = {
  light: {
    '--crm-app-body-bg': '#f4f6fb',
    '--crm-app-body-bg-alt': '#e9edf5',
    '--crm-app-surface': 'rgba(255, 255, 255, 0.94)',
    '--crm-app-surface-solid': '#ffffff',
    '--crm-app-surface-elevated': '#ffffff',
    '--crm-app-border': '#dbe3ef',
    '--crm-app-border-strong': '#bcc8dc',
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
    '--crm-app-body-bg': '#101318',
    '--crm-app-body-bg-alt': '#141922',
    '--crm-app-surface': 'rgba(22, 27, 35, 0.94)',
    '--crm-app-surface-solid': '#171b23',
    '--crm-app-surface-elevated': '#1d2430',
    '--crm-app-border': 'rgba(148, 163, 184, 0.2)',
    '--crm-app-border-strong': 'rgba(203, 213, 225, 0.32)',
    '--crm-app-border-soft': 'rgba(148, 163, 184, 0.18)',
    '--crm-app-text': '#e8edf5',
    '--crm-app-text-muted': '#a9b4c5',
    '--crm-app-menu-selected':
      'linear-gradient(135deg, rgba(99, 102, 241, 0.24), rgba(59, 130, 246, 0.16))',
    '--crm-app-menu-hover': 'rgba(148, 163, 184, 0.12)',
    '--crm-app-shadow': '0 18px 40px rgba(0, 0, 0, 0.42)',
    '--crm-app-shadow-strong': '0 24px 56px rgba(0, 0, 0, 0.58)',
    '--crm-app-accent-glow': 'rgba(99, 102, 241, 0.12)',
    '--crm-app-surface-glow': 'rgba(255, 255, 255, 0.07)',
    '--crm-app-selection': 'rgba(99, 102, 241, 0.3)',
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

function applyThemeRootState(theme) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
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
    applyThemeRootState(globalTheme);
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
        applyThemeRootState(nextTheme);
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
