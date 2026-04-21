type ApiErrorLike = {
  message?: string;
  details?: unknown;
  body?: {
    message?: string;
    detail?: string;
    details?: unknown;
  };
  response?: {
    data?: any;
  };
};

export const getApiErrorPayload = (error: ApiErrorLike) =>
  error?.details ?? error?.body?.details ?? error?.response?.data?.details ?? error?.response?.data ?? null;

export const getApiErrorMessage = (error: ApiErrorLike, fallback: string) => {
  const payload = getApiErrorPayload(error);

  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload && typeof payload === 'object') {
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail;
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;

    const firstValue = Object.values(payload)[0];
    if (Array.isArray(firstValue) && firstValue[0]) return String(firstValue[0]);
    if (typeof firstValue === 'string' && firstValue.trim()) return firstValue;
  }

  if (typeof error?.body?.detail === 'string' && error.body.detail.trim()) return error.body.detail;
  if (typeof error?.body?.message === 'string' && error.body.message.trim()) return error.body.message;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;

  return fallback;
};
