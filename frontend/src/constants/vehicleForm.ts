import { BODY_TYPE_LABELS, FUEL_TYPE_LABELS } from '../utils/constants';

export const TRANSMISSION_OPTIONS = [
  { value: 'Механика (МКПП)', label: 'Механика (МКПП)' },
  { value: 'Автомат (АКПП)', label: 'Автомат (АКПП)' },
  { value: 'Робот (AMT)', label: 'Робот (AMT)' },
  { value: 'Вариатор (CVT)', label: 'Вариатор (CVT)' },
] as const;

export const DRIVE_OPTIONS = [
  { value: 'Передний', label: 'Передний' },
  { value: 'Задний', label: 'Задний' },
  { value: 'Полный', label: 'Полный' },
] as const;

export const BODY_TYPE_OPTIONS = Object.entries(BODY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const FUEL_TYPE_OPTIONS = Object.entries(FUEL_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const DEFAULT_CATALOG_COLORS = [
  'Ледниковый',
  'Пантера',
  'Платина',
  'Борнео',
  'Капитан',
  'Кориандр',
  'Фламенко',
  'Белый',
  'Чёрный',
  'Серый',
] as const;
