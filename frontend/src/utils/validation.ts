export const PHONE_PATTERN = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const NAME_PATTERN = /^[а-яА-ЯёЁa-zA-Z][а-яА-ЯёЁa-zA-Z\s\-']{1,99}$/;
export const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;
export const COLOR_PATTERN = /^[а-яА-ЯёЁa-zA-Z0-9\s\-]+$/;

/** Разделитель дробной части в БД (SQL Server decimal — точка). */
export const DECIMAL_SEPARATOR = '.';

export const FIELD_LIMITS = {
  brand: 80,
  model: 80,
  title: 200,
  trim: 100,
  color: 50,
  description: 5000,
  vin: 17,
  priceMax: 999_999_999,
  priceDigits: 9,
  mileageMax: 9_999_999,
  mileageDigits: 7,
  discountMax: 99_999_999,
  discountDigits: 8,
  engineVolumeMax: 20,
} as const;

const CURRENT_YEAR = new Date().getFullYear();
export const MIN_CAR_YEAR = 1980;
export const MAX_CAR_YEAR = CURRENT_YEAR + 1;

export type FieldErrors = Record<string, string>;

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

export function sanitizeVinInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, FIELD_LIMITS.vin);
}

export function validateVin(vin: string): string | null {
  const v = sanitizeVinInput(vin);
  if (!v) return 'Укажите VIN — 17 символов';
  if (v.length !== 17) return 'VIN должен содержать ровно 17 символов';
  if (!VIN_PATTERN.test(v)) return 'VIN: только латинские буквы и цифры';
  return null;
}

export function validateColor(color: string): string | null {
  const trimmed = color.trim();
  if (!trimmed) return 'Укажите цвет';
  if (trimmed.length > FIELD_LIMITS.color) return `Цвет: не более ${FIELD_LIMITS.color} символов`;
  if (!COLOR_PATTERN.test(trimmed)) return 'Цвет: только буквы, цифры, пробел и дефис';
  return null;
}

export function validateYear(year: number | null | undefined): string | null {
  if (year == null || Number.isNaN(year)) return 'Укажите год выпуска';
  if (!Number.isInteger(year)) return 'Год должен быть целым числом';
  if (year < 0) return 'Год не может быть отрицательным';
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
  if (value <= 0 || value > FIELD_LIMITS.engineVolumeMax) {
    return `Объём двигателя: от 0.1 до ${FIELD_LIMITS.engineVolumeMax} л`;
  }
  return null;
}

/** Цифры без знака минус, с ограничением длины. */
export function sanitizeDigits(raw: string, maxLen: number): string {
  return raw.replace(/\D/g, '').slice(0, maxLen);
}

/** Парсит целое неотрицательное число из строки. */
export function parseNonNegativeInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

/** Разрешает ввод десятичного числа с точкой (как в БД). */
export function sanitizeDecimalInput(raw: string): string {
  let s = raw.replace(',', DECIMAL_SEPARATOR);
  s = s.replace(/[^\d.]/g, '');
  const dot = s.indexOf(DECIMAL_SEPARATOR);
  if (dot !== -1) {
    const intPart = s.slice(0, dot);
    const fracPart = s.slice(dot + 1).replace(/\./g, '').slice(0, 2);
    s = `${intPart}${DECIMAL_SEPARATOR}${fracPart}`;
  }
  return s;
}

export function parseDecimalInput(raw: string): number | null {
  const trimmed = sanitizeDecimalInput(raw.trim());
  if (!trimmed || trimmed === DECIMAL_SEPARATOR) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export type CatalogFormInput = {
  listingType: 'New' | 'Used';
  brandName: string;
  modelName: string;
  title?: string;
  color: string;
  basePrice: number;
  mileage?: number | null;
  modelYear?: number | null;
  vin?: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  driveType: string;
  trim?: string;
  engineCapacity?: number | null;
  tradeInDiscount?: number | null;
  creditDiscount?: number | null;
};

export function validateCatalogForm(form: CatalogFormInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.brandName.trim()) errors.brandName = 'Укажите марку';
  else if (form.brandName.trim().length > FIELD_LIMITS.brand) {
    errors.brandName = `Марка: не более ${FIELD_LIMITS.brand} символов`;
  }

  if (!form.modelName.trim()) errors.modelName = 'Укажите модель';
  else if (form.modelName.trim().length > FIELD_LIMITS.model) {
    errors.modelName = `Модель: не более ${FIELD_LIMITS.model} символов`;
  }

  if (form.title && form.title.length > FIELD_LIMITS.title) {
    errors.title = `Заголовок: не более ${FIELD_LIMITS.title} символов`;
  }

  const colorErr = validateColor(form.color ?? '');
  if (colorErr) errors.color = colorErr;

  const priceErr = validatePositiveNumber(form.basePrice, 'Цена', {
    max: FIELD_LIMITS.priceMax,
  });
  if (priceErr) errors.basePrice = priceErr;

  const yearErr = validateYear(form.modelYear);
  if (yearErr) errors.modelYear = yearErr;

  const vinErr = validateVin(form.vin ?? '');
  if (vinErr) errors.vin = vinErr;

  if (form.listingType === 'Used') {
    const mileageErr = validatePositiveNumber(form.mileage, 'Пробег', {
      max: FIELD_LIMITS.mileageMax,
    });
    if (mileageErr) errors.mileage = mileageErr;
  }

  const volumeErr = validateEngineVolume(form.engineCapacity);
  if (volumeErr) errors.engineCapacity = volumeErr;

  if (!form.bodyType) errors.bodyType = 'Выберите тип кузова';
  if (!form.fuelType) errors.fuelType = 'Выберите тип топлива';
  if (!form.transmission) errors.transmission = 'Выберите коробку передач';
  if (!form.driveType) errors.driveType = 'Выберите привод';

  if (form.trim && form.trim.length > FIELD_LIMITS.trim) {
    errors.trim = `Комплектация: не более ${FIELD_LIMITS.trim} символов`;
  }

  if (form.tradeInDiscount != null) {
    const dErr = validatePositiveNumber(form.tradeInDiscount, 'Скидка трейд-ин', {
      allowZero: true,
      max: FIELD_LIMITS.discountMax,
    });
    if (dErr) errors.tradeInDiscount = dErr;
  }

  if (form.creditDiscount != null) {
    const dErr = validatePositiveNumber(form.creditDiscount, 'Скидка за кредит', {
      allowZero: true,
      max: FIELD_LIMITS.discountMax,
    });
    if (dErr) errors.creditDiscount = dErr;
  }

  return errors;
}
