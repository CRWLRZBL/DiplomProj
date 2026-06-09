const STATUS_HINTS: Record<number, string> = {
  400: 'Проверьте введённые данные.',
  401: 'Войдите в аккаунт и повторите попытку.',
  403: 'Недостаточно прав для этого действия.',
  404: 'Запрашиваемые данные не найдены.',
  409: 'Данные конфликтуют с уже существующими.',
  422: 'Проверьте правильность заполнения полей.',
  500: 'Сервер временно недоступен. Попробуйте позже.',
};

/** Текст ошибки из ответа ASP.NET / axios (для отображения пользователю). */
export function getApiErrorMessage(e: unknown, fallback: string): string {
  const ax = e as {
    response?: { data?: unknown; status?: number };
    message?: string;
    code?: string;
  };

  if (ax.code === 'ERR_NETWORK' || ax.message === 'Network Error') {
    return 'Нет связи с сервером. Проверьте подключение к интернету и что приложение запущено.';
  }

  const data = ax.response?.data;
  if (data && typeof data === 'object' && data !== null) {
    const o = data as Record<string, unknown>;
    const errors = o.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors.map(String).join(' ');
    }
    const cand = o.error ?? o.Error ?? o.message ?? o.Message ?? o.title ?? o.detail;
    if (typeof cand === 'string' && cand.trim()) return cand;
  }

  const status = ax.response?.status;
  if (status && STATUS_HINTS[status]) {
    return `${fallback} ${STATUS_HINTS[status]}`;
  }
  return fallback;
}
