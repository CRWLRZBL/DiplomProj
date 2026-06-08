// Модели для конфигуратора автомобиля

export interface ColorOption {
  colorId: number;
  colorName: string;
  colorCode: string; // HEX код цвета для отображения
  priceModifier: number; // Изменение цены при выборе этого цвета
}

export interface EngineOption {
  engineId: number;
  engineName: string;
  engineCapacity: number; // Объем в литрах
  power: number; // Мощность в л.с.
  fuelType: string;
  priceModifier: number; // Изменение цены при выборе этого двигателя
}

export interface TransmissionOption {
  transmissionId: number;
  transmissionName: string;
  transmissionType: string; // Manual, Automatic, CVT и т.д.
  gears: number;
  priceModifier: number;
}

export interface CarConfiguration {
  // Базовые параметры
  colorId?: number;
  engineId?: number;
  transmissionId?: number;
  configurationId?: number;
  
  // Дополнительные опции
  optionIds: number[];
  
  // Итоговая цена
  totalPrice: number;
}

