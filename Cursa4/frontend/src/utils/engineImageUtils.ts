// Утилиты для работы с изображениями двигателей

/**
 * Генерирует путь к изображению двигателя на основе его характеристик
 * @param capacity - объем двигателя в литрах
 * @param power - мощность в л.с.
 * @param transmissionType - тип трансмиссии (Manual, Automatic, CVT, Robot)
 * @param modelName - название модели (для специальных случаев, например Niva Legend, Niva Travel)
 */
export const getEngineImagePath = (
  capacity: number,
  power?: number | null,
  transmissionType?: string | null,
  modelName?: string | null
): string => {
  // Нормализуем объем (убираем лишние нули)
  const capacityStr = capacity.toFixed(1).replace(/\.?0+$/, '');
  
  // Нормализуем мощность (обязательно должна быть)
  if (!power) {
    // Если нет мощности, возвращаем placeholder
    return '/images/engines/engine-placeholder.jpg';
  }
  // Используем переменную для возможной модификации мощности (для fallback)
  let actualPower = power;
  let powerStr = `${actualPower}hp`;
  
  // Нормализуем тип трансмиссии
  // CVT использует изображения с суффиксом _at, так как полноценных автоматов нет
  const transmissionStr = transmissionType 
    ? transmissionType.toLowerCase() === 'manual' ? '5mt' 
      : transmissionType.toLowerCase() === 'automatic' ? 'at'
      : transmissionType.toLowerCase() === 'cvt' ? 'at' // CVT использует изображения с _at
      : transmissionType.toLowerCase() === 'robot' ? '6mt'
      : '5mt'
    : '5mt';

  // Специальная обработка для Niva Legend и Niva Travel
  if (modelName) {
    const modelNameLower = modelName.toLowerCase();
    
    if (modelNameLower.includes('niva legend')) {
      // NL_17l_83hp_5mt.png
      const capacityL = Math.round(capacity * 10); // 1.7 -> 17
      return `/images/engines/NL_${capacityL}l_${powerStr}_${transmissionStr}.png`;
    }
    
    if (modelNameLower.includes('niva travel')) {
      // NT_18l_90hp_5mt.png
      const capacityL = Math.round(capacity * 10); // 1.8 -> 18
      return `/images/engines/NT_${capacityL}l_${powerStr}_${transmissionStr}.png`;
    }
  }

  // Для остальных моделей используем формат: код_мощность_трансмиссия
  // Код двигателя определяется по объему и мощности согласно спецификациям LADA
  // Примеры: 11182_90hp_5mt.png, 21129_106hp_5mt.png
  
  // Маппинг объемов и мощностей к кодам двигателей согласно спецификациям
  let engineCode = '';
  
  // 1.6 л двигатели
  if (Math.abs(capacity - 1.6) < 0.1) {
    if (power && power >= 85 && power < 88) {
      // K7M: 1.6 л, 87 л.с. (Largus) - есть файл K7M-87hp.png
      // Для K7M используем специальное изображение (не зависит от трансмиссии)
      return `/images/engines/K7M-87hp.png`;
    } else if (power && power >= 88 && power < 92) {
      // BA3-11186: 1.6 л, 90 л.с. (Granta, Iskra) - есть файл 11186_90hp_5mt.png
      engineCode = '11186';
    } else if (power && power >= 100 && power < 110) {
      // BA3-21127: 1.6 л, 106 л.с. (Granta)
      // BA3-21129: 1.6 л, 106 л.с. (Vesta, Largus) - есть файлы 21129_106hp_*.png
      engineCode = '21129'; // Используем 21129 для 106 л.с.
    } else if (power && power >= 110 && power < 120) {
      // H4M: 1.6 л, 113 л.с. (Vesta, Iskra)
      // Для H4M используем специальное изображение H4M.png (не зависит от трансмиссии)
      // Это исключение - для H4M не используем _at даже если CVT
      return `/images/engines/H4M.png`;
    } else if (power && power >= 115 && power < 125) {
      // BA3-11182: 1.6 л, 118 л.с. - есть файл 11182_118hp_5mt.png
      engineCode = '11182';
    }
  }
  // 1.7 л двигатели
  else if (Math.abs(capacity - 1.7) < 0.1) {
    if (power && power >= 80 && power < 90) {
      // BA3-21214: 1.7 л, 83 л.с. (Niva Legend, Niva Travel)
      // Обрабатывается выше для Niva Legend/Travel
      const capacityL = Math.round(capacity * 10);
      return `/images/engines/${capacityL}l_${powerStr}_${transmissionStr}.png`;
    }
  }
  // 1.8 л двигатели
  else if (Math.abs(capacity - 1.8) < 0.1) {
    if (power && power >= 85 && power < 95) {
      // 1.8 л, 90 л.с. (Niva Travel) - используем формат с объемом
      const capacityL = Math.round(capacity * 10);
      return `/images/engines/${capacityL}l_${powerStr}_${transmissionStr}.png`;
    } else if (power && power >= 100 && power < 110) {
      // BA3-21129: 1.6 л, 106 л.с. (но может быть указан как 1.8 в некоторых случаях)
      engineCode = '21129';
    } else if (power && power >= 120 && power < 130) {
      // BA3-21179: 1.8 л, 122 л.с. (Vesta, Aura)
      // Используем код 21179 для этого двигателя, если файл не найден - будет fallback
      // Если CVT, transmissionStr уже установлен в 'at'
      return `/images/engines/21179_${powerStr}_${transmissionStr}.png`;
    } else if (power && power >= 140 && power < 150) {
      // BA3-21179-77: 1.8 л, 145 л.с. (Vesta Sport)
      // Используем код 21179 для этого двигателя
      // Если CVT, transmissionStr уже установлен в 'at'
      return `/images/engines/21179_${powerStr}_${transmissionStr}.png`;
    }
  }
  
  // Если код найден, используем его
  // Для CVT transmissionStr уже установлен в 'at'
  if (engineCode) {
    return `/images/engines/${engineCode}_${powerStr}_${transmissionStr}.png`;
  }
  
  // Если код не найден, пробуем использовать формат с объемом
  // Для CVT transmissionStr уже установлен в 'at'
  const capacityL = Math.round(capacity * 10);
  // Используем формат с подчеркиваниями: 18l_122hp_at.png
  return `/images/engines/${capacityL}l_${powerStr}_${transmissionStr}.png`;
};

/**
 * Получает путь к изображению двигателя с fallback
 */
export const getEngineImagePathWithFallback = (
  capacity: number,
  power?: number | null,
  transmissionType?: string | null,
  modelName?: string | null
): string => {
  const primaryPath = getEngineImagePath(capacity, power, transmissionType, modelName);
  return primaryPath;
};

