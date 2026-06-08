// Утилиты для работы с изображениями автомобилей

/**
 * Преобразует название модели в название папки
 */
export const getModelFolderName = (name: string): string => {
  const modelMap: Record<string, string> = {
    'Granta': 'Granta',
    'Vesta': 'Vesta',
    'Largus': 'Largus',
    'Niva Travel': 'Niva Travel',
    'Niva Legend': 'Niva Legend',
    'Iskra': 'Iskra',
    'Aura': 'Aura',
  };
  
  for (const [key, value] of Object.entries(modelMap)) {
    if (name.includes(key)) {
      return value;
    }
  }
  
  return name;
};

/**
 * Преобразует тип кузова/комплектации в префикс файла
 * @param bodyType - тип кузова или название комплектации (например, 'SUV', 'Sedan', 'Standard Plus')
 * @param modelName - название модели (для специальных случаев)
 * @param configurationName - название комплектации (если доступно)
 */
export const getConfigurationPrefix = (
  bodyType: string, 
  modelName?: string, 
  configurationName?: string
): string => {
  if (!modelName) {
    return 'Sedan'; // По умолчанию
  }
  
  const modelNameLower = modelName.toLowerCase();
  
  // ВАЖНО: Проверяем Sport и Sportline модели ДО других проверок
  // Granta Sport -> Sport (отдельная модель, не комплектация)
  if (modelNameLower.includes('granta sportline')) {
    // Для Sportline моделей используем Sportline префикс
    if (bodyType?.toLowerCase().includes('хэтчбек') || bodyType?.toLowerCase().includes('hatchback') || bodyType?.toLowerCase().includes('liftback')) {
      return 'Sportline-LiftBack';
    }
    return 'Sportline';
  }
  if (modelNameLower.includes('granta sport') && !modelNameLower.includes('sportline')) {
    // Для Sport моделей используем Sport префикс
    if (bodyType?.toLowerCase().includes('хэтчбек') || bodyType?.toLowerCase().includes('hatchback') || bodyType?.toLowerCase().includes('liftback')) {
      return 'Sport-LiftBack';
    }
    return 'Sport';
  }
  if (modelNameLower.includes('vesta sportline')) {
    // Vesta Sportline - это отдельная модель, не комплектация
    return 'Sportline'; // Vesta Sportline использует обычные изображения Sportline
  }
  
  // Специальная обработка для Aura - используем название модели
  if (modelNameLower.includes('aura')) {
    return 'Aura';
  }
  
  // Специальная обработка для Niva Travel
  if (modelNameLower.includes('niva travel')) {
    // Проверяем, есть ли файлы с префиксом Travel-NEW
    return 'Travel-NEW'; // Используем Travel-NEW, так как файлы имеют такой префикс
  }
  
  // Специальная обработка для Niva Legend
  // Niva Legend Bronto, Urban, Sport - это отдельные модели
  if (modelNameLower.includes('niva legend bronto')) {
    return 'Bronto';
  }
  if (modelNameLower.includes('niva legend urban')) {
    return 'Legend-Urban';
  }
  if (modelNameLower.includes('niva legend sport') || modelNameLower.includes('niva sport')) {
    return 'Sport';
  }
  
  // Для обычного Niva Legend префикс зависит от комплектации
  if (modelNameLower.includes('niva legend')) {
    // Если есть название комплектации, используем его
    if (configurationName) {
      const configName = configurationName.toLowerCase();
      if (configName.includes('bronto')) {
        return 'Bronto';
      }
      if (configName.includes('urban')) {
        return 'Legend-Urban';
      }
      if (configName.includes('sport') || configName.includes('спорт')) {
        return 'Sport';
      }
    }
    // По умолчанию для Niva Legend
    return 'Legend';
  }
  
  // Iskra SW Cross -> SW-Cross (должно быть перед Iskra SW)
  if (modelNameLower.includes('iskra sw cross') || modelNameLower.includes('iskra sw-cross')) {
    return 'SW-Cross';
  }
  
  // Iskra SW -> SW (должно быть перед обычным Iskra)
  if (modelNameLower.includes('iskra sw') && !modelNameLower.includes('cross')) {
    return 'SW';
  }
  
  // Для обычного Iskra используем Sedan (судя по структуре файлов)
  if (modelNameLower.includes('iskra') && !modelNameLower.includes('sw')) {
    return 'Sedan';
  }
  
  // Парсим название модели для определения префикса
  // Granta Cross -> Cross
  if (modelNameLower.includes('cross') && !modelNameLower.includes('sw cross') && !modelNameLower.includes('activecross')) {
    // Проверяем, не является ли это SW Cross
    if (modelNameLower.includes('sw cross') || modelNameLower.includes('sw-cross')) {
      return 'SW-Cross';
    }
    if (modelNameLower.includes('active cross') || modelNameLower.includes('activecross')) {
      return 'ActiveCross';
    }
    return 'Cross';
  }
  
  // Vesta SW Cross -> SW-Cross
  if (modelNameLower.includes('sw cross') || modelNameLower.includes('sw-cross')) {
    return 'SW-Cross';
  }
  
  // Vesta SW -> SW
  if (modelNameLower.includes(' sw') && !modelNameLower.includes('cross')) {
    return 'SW';
  }
  
  // Granta Хэтчбек -> LiftBack
  if (modelNameLower.includes('хэтчбек') || modelNameLower.includes('hatchback')) {
    return 'LiftBack';
  }
  
  // Largus Cross -> Cross (должен быть перед проверкой Универсал)
  if (modelNameLower.includes('largus cross')) {
    return 'Cross';
  }
  
  // Largus Универсал -> Универсал
  if (modelNameLower.includes('универсал')) {
    // Проверяем CNG
    if (modelNameLower.includes('cng')) {
      return 'Универсал-CNG';
    }
    return 'Универсал';
  }
  
  // Largus Фургон -> Фургон
  if (modelNameLower.includes('фургон')) {
    if (modelNameLower.includes('cng')) {
      return 'Фургон-CNG';
    }
    return 'Фургон';
  }
  
  // Если есть название комплектации, используем его для определения префикса
  if (configurationName) {
    const configName = configurationName.toLowerCase();
    
    // Проверяем специальные названия комплектаций
    if (configName.includes('sportline') || configName.includes('спортлайн')) {
      if (configName.includes('liftback') || configName.includes('хэтчбек')) {
        return 'Sportline-LiftBack';
      }
      return 'Sportline';
    }
    if (configName.includes('sport') && !configName.includes('sportline')) {
      if (configName.includes('liftback') || configName.includes('хэтчбек')) {
        return 'Sport-LiftBack';
      }
      return 'Sport';
    }
    if (configName.includes('cross') || configName.includes('кросс')) {
      if (configName.includes('active')) {
        return 'ActiveCross';
      }
      if (configName.includes('sw')) {
        return 'SW-Cross';
      }
      return 'Cross';
    }
    if (configName.includes('sw') || configName.includes('универсал')) {
      if (configName.includes('cross')) {
        return 'SW-Cross';
      }
      if (configName.includes('sportline') || configName.includes('spotline')) {
        return 'SW-Spotline';
      }
      return 'SW';
    }
    if (configName.includes('liftback') || configName.includes('хэтчбек')) {
      if (configName.includes('sportline')) {
        return 'Sportline-LiftBack';
      }
      if (configName.includes('sport')) {
        return 'Sport-LiftBack';
      }
      return 'LiftBack';
    }
    if (configName.includes('фургон')) {
      if (configName.includes('cng')) {
        return 'Фургон-CNG';
      }
      return 'Фургон';
    }
    if (configName.includes('универсал')) {
      if (configName.includes('cng')) {
        return 'Универсал-CNG';
      }
      return 'Универсал';
    }
  }
  
  // Маппинг типов кузова как fallback
  const configMap: Record<string, string> = {
    'Sedan': 'Sedan',
    'Седан': 'Sedan',
    'Hatchback': 'LiftBack',
    'LiftBack': 'LiftBack',
    'Хэтчбек': 'LiftBack',
    'StationWagon': 'SW',
    'Универсал': 'Универсал',
    'SUV': 'Travel-NEW', // Для Niva Travel используется Travel-NEW
  };
  
  for (const [key, value] of Object.entries(configMap)) {
    if (bodyType.includes(key)) {
      return value;
    }
  }
  
  return 'Sedan'; // По умолчанию
};

/**
 * Получает путь к изображению модели в указанном цвете (или базовом цвете Ледниковый по умолчанию)
 */
export const getModelImagePath = (
  modelName: string, 
  bodyType: string, 
  fallbackImageUrl?: string,
  configurationName?: string,
  colorName?: string | null
): string => {
  // Если есть imageUrl, используем его
  if (fallbackImageUrl) {
    return fallbackImageUrl;
  }
  
  // Формируем путь к изображению в указанном цвете или базовом цвете Ледниковый
  const modelFolder = getModelFolderName(modelName);
  const configPrefix = getConfigurationPrefix(bodyType, modelName, configurationName);
  
  // Используем выбранный цвет или базовый цвет Ледниковый
  let color = colorName || 'Ледниковый';
  
  // Для Aura, если нет Ледниковый, используем Платина как fallback
  if (modelName.toLowerCase().includes('aura') && color === 'Ледниковый') {
    // Проверяем наличие Ледниковый, если нет - используем Платина
    // В реальности это будет проверено на клиенте через onError
    // Но для Aura по умолчанию используем Платина, так как Ледниковый отсутствует
    const auraColors = ['Платина', 'Кориандр', 'Пантера'];
    // Используем Платина как базовый цвет для Aura
    color = 'Платина';
  }
  
  // Нормализуем название цвета (убираем пробелы для поиска файла)
  let normalizedColor = color.replace(/\s+/g, '');
  
  // Специальная обработка для "Несси 2" -> "Несси2"
  if (color === 'Несси 2' || color === 'Несси2') {
    normalizedColor = 'Несси2';
  }
  
  return `/images/cars/${modelFolder}/${configPrefix}-${normalizedColor}.png`;
};

