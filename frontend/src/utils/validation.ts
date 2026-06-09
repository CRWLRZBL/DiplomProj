export const PHONE_PATTERN = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const NAME_PATTERN = /^[а-яА-ЯёЁa-zA-Z][а-яА-ЯёЁa-zA-Z\s\-']{1,99}$/;
export const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

const CURRENT_YEAR = new Date().getFullYear();
export const MIN_CAR_YEAR = 1980;
export const MAX_CAR_YEAR = CURRENT_YEAR + 1;

export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  const local = digits.startsWith('7')
    ? digits.slice(1)
    : digits.startsWith('8')
      ? digits.slice(1)
      : digits;
  const d = local.slice(0, 10);
  if (d.length < 4) return input;
  if (d.length < 10) {
    if (d.length <= 3) return `+7 (${d}`;
    if (d.length <= 6) return `+7 (${d.slice(0, 3)}) ${d.slice(3)}`;
    if (d.length <= 8) return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
  }
  return `+7 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

export function validatePhone(phone: string): string | null {
  const normalized = normalizePhone(phone);
  if (!PHONE_PATTERN.test(normalized)) {
    return 'Введите телефон в формате +7 (999) 999-99-99';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Укажите email';
  if (!EMAIL_PATTERN.test(trimmed)) return 'Введите корректный email, например name@example.ru';
  return null;
}

export function validateName(name: string, label = 'Имя'): string | null {
  const trimmed = name.trim();
  if (!trimmed) return `Укажите ${label.toLowerCase()}`;
  if (!NAME_PATTERN.test(trimmed)) {
    return `${label}: только буквы, от 2 до 100 символов`;
  }
  return null;
}

export function validateVin(vin: string): string | null {
  const v = vin.trim().toUpperCase();
  if (!v) return 'Укажите VIN — 17 символов';
  if (v.length !== 17) return 'VIN должен содержать ровно 17 символов';
  if (!VIN_PATTERN.test(v)) return 'VIN: только латинские буквы (кроме I, O, Q) и цифры';
  return null;
}

export function validateYear(year: number | null | undefined): string | null {
  if (year == null || Number.isNaN(year)) return 'Укажите год выпуска';
  if (!Number.isInteger(year)) return 'Год должен быть целым числом';
  if (year < MIN_CAR_YEAR || year > MAX_CAR_YEAR) {
    return `Год выпуска: от ${MIN_CAR_YEAR} до ${MAX_CAR_YEAR}`;
  }
  return null;
}

export function validatePositiveNumber(
  value: number | null | undefined,
  label: string,
  options?: { allowZero?: boolean; max?: number }
): string | null {
  if (value == null || Number.isNaN(value)) return `Укажите ${label.toLowerCase()}`;
  const min = options?.allowZero ? 0 : 1;
  if (value < min) return `${label} не может быть отрицательным`;
  if (options?.max != null && value > options.max) {
    return `${label}: не более ${options.max.toLocaleString('ru-RU')}`;
  }
  return null;
}

export function validateEngineVolume(value: number | null | undefined): string | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value <= 0 || value > 20) return 'Объём двигателя: от 0.1 до 20 л';
  return null;
}

/** Парсит целое неотрицательное число из строки (без «1+1», минусов и т.п.). */
export function parseNonNegativeInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

export function parsePositiveDecimal(raw: string): number | null {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}
