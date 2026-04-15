import { useCallback, useEffect, useRef } from 'react';

interface UseBackgroundRefreshOptions {
  enabled?: boolean;
  interval?: number;
  runOnFocus?: boolean;
  pauseWhenHidden?: boolean;
}

export function useBackgroundRefresh(
  refreshFn?: (() => void | Promise<unknown>) | null,
  options: UseBackgroundRefreshOptions = {},
) {
  const {
    enabled = true,
    interval = 30000,
    runOnFocus = true,
    pauseWhenHidden = true,
  } = options;
  const refreshRef = useRef(refreshFn);
  const inFlightRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  const triggerRefresh = useCallback(async () => {
    if (!enabled || typeof refreshRef.current !== 'function' || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    try {
      await refreshRef.current();
    } finally {
      inFlightRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || interval <= 0 || typeof window === 'undefined') {
      return undefined;
    }

    const tick = () => {
      if (pauseWhenHidden && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }
      void triggerRefresh();
    };

    const timerId = window.setInterval(tick, interval);
    return () => window.clearInterval(timerId);
  }, [enabled, interval, pauseWhenHidden, triggerRefresh]);

  useEffect(() => {
    if (!enabled || !runOnFocus || typeof window === 'undefined') {
      return undefined;
    }

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      void triggerRefresh();
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, runOnFocus, triggerRefresh]);

  return { triggerRefresh };
}
