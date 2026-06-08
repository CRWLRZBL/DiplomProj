/** Текст ошибки из ответа ASP.NET / axios (для отображения пользователю). */
export function getApiErrorMessage(e: unknown, fallback: string): string {
  const ax = e as {
    response?: { data?: unknown; status?: number };
    message?: string;
    code?: string;
  };

  if (ax.code === 'ERR_NETWORK' || ax.message === 'Network Error') {
    return `${fallback} Нет ответа от сервера — запустите API (например dotnet run на порту 5171) и проверьте VITE_API_URL.`;
  }

  const data = ax.response?.data;
  if (data && typeof data === 'object' && data !== null) {
    const o = data as Record<string, unknown>;
    const cand = o.error ?? o.Error ?? o.title ?? o.detail;
    if (typeof cand === 'string' && cand.trim()) return cand;
  }
  if (ax.response?.status && ax.response.status >= 500) {
    return `${fallback} (код ${ax.response.status})`;
  }
  return fallback;
}
