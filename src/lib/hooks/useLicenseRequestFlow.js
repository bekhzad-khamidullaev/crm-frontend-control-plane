import { useCallback, useEffect, useRef, useState } from 'react';

const LICENSE_REQUEST_STATE_STORAGE_KEY = 'enterprise_crm_license_request_state';
export const LICENSE_PENDING_POLL_INTERVAL_MS = 15000;
export const LICENSE_PENDING_POLL_MAX_ATTEMPTS = 20;

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function parseCode(value) {
  return String(value || '').trim().toUpperCase();
}

function pickMessage(payload, details = {}) {
  return String(
    details.control_plane_message
      || payload.control_plane_message
      || details.detail
      || payload.detail
      || details.message
      || payload.message
      || '',
  );
}

function toRequestPayload(payload = {}) {
  const details = isObject(payload.details) ? payload.details : {};
  return { payload, details };
}

export function normalizeLicenseRequestOutcome(payload = {}) {
  if (!isObject(payload)) return null;
  const { details } = toRequestPayload(payload);
  const code = parseCode(payload.code || details.code);
  const status = parseStatus(payload.status || details.status);
  const requestStatus = parseStatus(details.request_status || payload.request_status || status);
  const requestId = String(details.request_id || payload.request_id || '').trim();
  const message = pickMessage(payload, details);

  if (status === 'installed') {
    return {
      kind: 'installed',
      requestId,
      requestStatus: status,
      message,
      code,
    };
  }

  if (requestStatus === 'rejected' || code === 'LICENSE_REQUEST_REJECTED') {
    return {
      kind: 'rejected',
      requestId,
      requestStatus: 'rejected',
      message,
      code: code || 'LICENSE_REQUEST_REJECTED',
    };
  }

  if (
    requestStatus === 'pending'
    || requestStatus === 'pending_review'
    || status === 'pending'
    || code === 'LICENSE_REQUEST_PENDING'
  ) {
    return {
      kind: 'pending',
      requestId,
      requestStatus: requestStatus || 'pending_review',
      message,
      code: code || 'LICENSE_REQUEST_PENDING',
    };
  }

  return null;
}

export function normalizeLicenseRequestOutcomeFromError(error) {
  const details = isObject(error?.details) ? error.details : null;
  if (details) {
    const parsed = normalizeLicenseRequestOutcome({
      ...details,
      code: details.code || error?.code,
      message: details.message || error?.message,
      detail: details.detail || error?.message,
    });
    if (parsed) return parsed;
  }
  return normalizeLicenseRequestOutcome(error || {});
}

function readStoredRequestState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LICENSE_REQUEST_STATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) return null;
    const kind = String(parsed.kind || '').trim();
    if (kind !== 'pending' && kind !== 'rejected') return null;
    return {
      kind,
      requestId: String(parsed.requestId || '').trim(),
      requestStatus: String(parsed.requestStatus || (kind === 'rejected' ? 'rejected' : 'pending_review')).trim(),
      message: String(parsed.message || '').trim(),
      lastCheckedAt: parsed.lastCheckedAt ? String(parsed.lastCheckedAt) : null,
    };
  } catch {
    return null;
  }
}

function persistRequestState(state) {
  if (typeof window === 'undefined') return;
  try {
    if (!state || (state.kind !== 'pending' && state.kind !== 'rejected')) {
      sessionStorage.removeItem(LICENSE_REQUEST_STATE_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(
      LICENSE_REQUEST_STATE_STORAGE_KEY,
      JSON.stringify({
        kind: state.kind,
        requestId: state.requestId || '',
        requestStatus: state.requestStatus || (state.kind === 'rejected' ? 'rejected' : 'pending_review'),
        message: state.message || '',
        lastCheckedAt: state.lastCheckedAt || null,
      }),
    );
  } catch {
    // Ignore storage failures.
  }
}

export function useLicenseRequestFlow({
  requestLicense,
  reloadEntitlements,
  isInstalled = false,
  pollIntervalMs = LICENSE_PENDING_POLL_INTERVAL_MS,
  maxPollAttempts = LICENSE_PENDING_POLL_MAX_ATTEMPTS,
  onPollingLimitReached,
}) {
  const initialStateRef = useRef(readStoredRequestState());
  const requestLicenseRef = useRef(requestLicense);
  const reloadEntitlementsRef = useRef(reloadEntitlements);
  const pollingLimitCallbackRef = useRef(onPollingLimitReached);
  const timerRef = useRef(null);
  const pollInFlightRef = useRef(false);
  const pollAttemptsRef = useRef(0);

  const [requestState, setRequestState] = useState(initialStateRef.current);
  const [requestLoading, setRequestLoading] = useState(false);
  const [polling, setPolling] = useState(initialStateRef.current?.kind === 'pending');
  const [pollAttempts, setPollAttempts] = useState(0);

  useEffect(() => {
    requestLicenseRef.current = requestLicense;
  }, [requestLicense]);

  useEffect(() => {
    reloadEntitlementsRef.current = reloadEntitlements;
  }, [reloadEntitlements]);

  useEffect(() => {
    pollingLimitCallbackRef.current = onPollingLimitReached;
  }, [onPollingLimitReached]);

  const setAndPersistRequestState = useCallback((updater) => {
    setRequestState((previous) => {
      const next = typeof updater === 'function' ? updater(previous) : updater;
      persistRequestState(next);
      return next;
    });
  }, []);

  const stopPolling = useCallback(({ keepState = true } = {}) => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    pollAttemptsRef.current = 0;
    setPollAttempts(0);
    setPolling(false);
    if (!keepState) {
      setAndPersistRequestState(null);
    }
  }, [setAndPersistRequestState]);

  const pausePolling = useCallback(() => {
    stopPolling({ keepState: true });
  }, [stopPolling]);

  const clearRequestState = useCallback(() => {
    stopPolling({ keepState: false });
  }, [stopPolling]);

  const markPendingState = useCallback((pending, { checkedNow = false } = {}) => {
    setAndPersistRequestState((previous) => ({
      kind: 'pending',
      requestId: String(pending?.requestId || previous?.requestId || '').trim(),
      requestStatus: String(pending?.requestStatus || 'pending_review').trim() || 'pending_review',
      message: String(pending?.message || '').trim(),
      lastCheckedAt: checkedNow ? new Date().toISOString() : previous?.lastCheckedAt || null,
    }));
  }, [setAndPersistRequestState]);

  const markRejectedState = useCallback((rejected, { checkedNow = false } = {}) => {
    setAndPersistRequestState((previous) => ({
      kind: 'rejected',
      requestId: String(rejected?.requestId || previous?.requestId || '').trim(),
      requestStatus: 'rejected',
      message: String(rejected?.message || '').trim(),
      lastCheckedAt: checkedNow ? new Date().toISOString() : previous?.lastCheckedAt || null,
    }));
  }, [setAndPersistRequestState]);

  const refreshEntitlements = useCallback(async () => {
    if (typeof reloadEntitlementsRef.current === 'function') {
      await reloadEntitlementsRef.current();
    }
  }, []);

  const startPolling = useCallback((seed = null) => {
    const normalizedSeed = normalizeLicenseRequestOutcome(seed || {});
    if (normalizedSeed?.kind === 'rejected') {
      stopPolling({ keepState: true });
      markRejectedState(normalizedSeed);
      return false;
    }
    const pendingSeed = normalizedSeed?.kind === 'pending'
      ? normalizedSeed
      : {
          requestId: '',
          requestStatus: 'pending_review',
          message: '',
        };
    stopPolling({ keepState: false });
    markPendingState(pendingSeed);
    pollAttemptsRef.current = 0;
    setPollAttempts(0);
    setPolling(true);
    return true;
  }, [markPendingState, markRejectedState, stopPolling]);

  const resumePolling = useCallback((seed = null) => {
    if (seed) {
      return startPolling(seed);
    }
    if (requestState?.kind !== 'pending') return false;
    pollAttemptsRef.current = 0;
    setPollAttempts(0);
    setPolling(true);
    return true;
  }, [requestState?.kind, startPolling]);

  const pollNow = useCallback(async ({ manual = false } = {}) => {
    if (pollInFlightRef.current) return { type: 'busy' };
    pollInFlightRef.current = true;
    try {
      const response = await requestLicenseRef.current();
      const normalized = normalizeLicenseRequestOutcome(response);
      if (normalized?.kind === 'installed') {
        stopPolling({ keepState: false });
        await refreshEntitlements();
        return { type: 'installed', response };
      }
      if (normalized?.kind === 'pending') {
        markPendingState(normalized, { checkedNow: true });
        return { type: 'pending', state: normalized, manual };
      }
      if (normalized?.kind === 'rejected') {
        stopPolling({ keepState: true });
        markRejectedState(normalized, { checkedNow: true });
        return { type: 'rejected', state: normalized, manual };
      }
      stopPolling({ keepState: false });
      await refreshEntitlements();
      return { type: 'unknown', response };
    } catch (error) {
      const normalized = normalizeLicenseRequestOutcomeFromError(error);
      if (normalized?.kind === 'pending') {
        markPendingState(normalized, { checkedNow: true });
        return { type: 'pending', state: normalized, manual, error };
      }
      if (normalized?.kind === 'rejected') {
        stopPolling({ keepState: true });
        markRejectedState(normalized, { checkedNow: true });
        return { type: 'rejected', state: normalized, manual, error };
      }
      return { type: 'error', error, manual };
    } finally {
      pollInFlightRef.current = false;
    }
  }, [markPendingState, markRejectedState, refreshEntitlements, stopPolling]);

  const requestOnline = useCallback(async (requestPayload = {}) => {
    setRequestLoading(true);
    try {
      const response = await requestLicenseRef.current(requestPayload);
      const normalized = normalizeLicenseRequestOutcome(response);
      if (normalized?.kind === 'installed') {
        stopPolling({ keepState: false });
        await refreshEntitlements();
        return { type: 'installed', response };
      }
      if (normalized?.kind === 'pending') {
        startPolling(normalized);
        return { type: 'pending', state: normalized };
      }
      if (normalized?.kind === 'rejected') {
        stopPolling({ keepState: true });
        markRejectedState(normalized);
        return { type: 'rejected', state: normalized };
      }
      stopPolling({ keepState: false });
      await refreshEntitlements();
      return { type: 'unknown', response };
    } catch (error) {
      const normalized = normalizeLicenseRequestOutcomeFromError(error);
      if (normalized?.kind === 'pending') {
        startPolling(normalized);
        return { type: 'pending', state: normalized, error };
      }
      if (normalized?.kind === 'rejected') {
        stopPolling({ keepState: true });
        markRejectedState(normalized);
        return { type: 'rejected', state: normalized, error };
      }
      return { type: 'error', error };
    } finally {
      setRequestLoading(false);
    }
  }, [markRejectedState, refreshEntitlements, startPolling, stopPolling]);

  useEffect(() => {
    if (!polling) return undefined;
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setInterval(() => {
      if (pollInFlightRef.current) return;
      const nextAttempt = pollAttemptsRef.current + 1;
      pollAttemptsRef.current = nextAttempt;
      setPollAttempts(nextAttempt);

      if (nextAttempt > maxPollAttempts) {
        stopPolling({ keepState: true });
        if (typeof pollingLimitCallbackRef.current === 'function') {
          pollingLimitCallbackRef.current();
        }
        return;
      }
      void pollNow();
    }, pollIntervalMs);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [maxPollAttempts, pollIntervalMs, pollNow, polling, stopPolling]);

  useEffect(() => {
    if (isInstalled) {
      stopPolling({ keepState: false });
    }
  }, [isInstalled, stopPolling]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return {
    requestState,
    pendingRequest: requestState?.kind === 'pending' ? requestState : null,
    rejectedRequest: requestState?.kind === 'rejected' ? requestState : null,
    requestLoading,
    polling,
    pollAttempts,
    maxPollAttempts,
    requestOnline,
    pollNow,
    startPolling,
    resumePolling,
    pausePolling,
    stopPolling,
    clearRequestState,
  };
}
