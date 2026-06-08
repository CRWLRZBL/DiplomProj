export interface Car {
  carId: number;
  modelId?: number | null;
  configuratorModelId?: number | null;
  listingType: 'New' | 'Used' | string;
  brandName: string;
  modelName: string;
  title?: string;
  bodyType: string;
  basePrice: number;
  showPriceFrom: boolean;
  color: string;
  status: string;
  vin: string;
  mileage?: number | null;
  modelYear: number;
  fuelType: string;
  engineCapacity?: number | null;
  transmission?: string;
  driveType?: string;
  trim?: string;
  generation?: string;
  condition?: string;
  description?: string;
  configurationName?: string;
  imageUrl?: string;
  imageUrls?: string[];
  tradeInDiscount?: number | null;
  creditDiscount?: number | null;
  isPublished?: boolean;
  priceWithDiscounts?: number | null;
  maxDiscount?: number | null;
}

export type SaveCarListing = {
  listingType: 'New' | 'Used';
  brandName: string;
  modelName: string;
  title?: string;
  bodyType?: string;
  basePrice: number;
  showPriceFrom: boolean;
  color: string;
  status: string;
  vin?: string;
  mileage?: number | null;
  modelYear?: number | null;
  fuelType?: string;
  engineCapacity?: number | null;
  transmission?: string;
  driveType?: string;
  trim?: string;
  generation?: string;
  condition?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  tradeInDiscount?: number | null;
  creditDiscount?: number | null;
  isPublished: boolean;
  configuratorModelId?: number | null;
};

export interface Configuration {
  configurationId: number;
  configurationName: string;
  description: string;
  additionalPrice: number;
}

export interface AdditionalOption {
  optionId: number;
  optionName: string;
  description: string;
  optionPrice: number;
  category: string;
}

export interface Model {
  modelId: number;
  brandName: string;
  modelName: string;
  bodyType: string;
  basePrice: number;
  modelYear: number;
  fuelType?: string;
  engineCapacity?: number;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  availableCount: number;
}
