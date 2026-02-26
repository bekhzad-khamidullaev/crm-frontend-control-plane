import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'contora-theme';
const EVENT_KEY = 'contora-theme-change';

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
        window.localStorage.setItem(STORAGE_KEY, nextTheme);
        window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: nextTheme }));
      }
      return nextTheme;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
