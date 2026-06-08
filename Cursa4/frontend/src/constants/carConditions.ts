/** Состояние автомобиля с пробегом (каталог и админка). */
export const CAR_CONDITION_OPTIONS = [
  'Новый',
  'Отличное состояние',
  'Хорошее состояние',
  'Удовлетворительное',
  'Плохое',
] as const;

export type CarCondition = (typeof CAR_CONDITION_OPTIONS)[number];

export const DEFAULT_CONDITION_NEW = 'Новый';
export const DEFAULT_CONDITION_USED = 'Хорошее состояние';
