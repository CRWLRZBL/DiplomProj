import { apiClient } from './apiClient';
import { Car, Configuration, AdditionalOption, Model, SaveCarListing } from '../models/car';

export const carService = {
  async getCars(brand?: string, bodyType?: string, all: boolean = false): Promise<Car[]> {
    const params = new URLSearchParams();
    if (brand) params.append('brand', brand);
    if (bodyType) params.append('bodyType', bodyType);
    if (all) params.append('all', 'true');
    
    const response = await apiClient.get<Car[]>(`/cars?${params}`);
    return response.data;
  },

  async getModels(brand?: string, bodyType?: string): Promise<Model[]> {
    const params = new URLSearchParams();
    if (brand) params.append('brand', brand);
    if (bodyType) params.append('bodyType', bodyType);
    
    const response = await apiClient.get<Model[]>(`/cars/models?${params}`);
    return response.data;
  },

  async getModelById(id: number): Promise<Model> {
    const response = await apiClient.get<Model>(`/cars/models/${id}`);
    return response.data;
  },

  async getCarById(id: number): Promise<Car> {
    const response = await apiClient.get<Car>(`/cars/${id}`);
    return response.data;
  },

  async getConfigurations(carId: number): Promise<Configuration[]> {
    const response = await apiClient.get<Configuration[]>(`/cars/${carId}/configurations`);
    return response.data;
  },

  async getConfigurationsByModelId(modelId: number): Promise<Configuration[]> {
    const response = await apiClient.get<Configuration[]>(`/cars/models/${modelId}/configurations`);
    return response.data;
  },

  async getAdditionalOptions(): Promise<AdditionalOption[]> {
    const response = await apiClient.get<AdditionalOption[]>('/cars/options');
    return response.data;
  },

  async getBrands(): Promise<{ brandId: number; brandName: string }[]> {
    const response = await apiClient.get('/cars/brands');
    return response.data;
  },

  async getBodyTypes(): Promise<string[]> {
    const response = await apiClient.get('/cars/filters/body-types');
    return response.data;
  },

  // Методы для конфигуратора (если API поддерживает)
  async getAvailableColors(carId: number): Promise<{ colorId: number; colorName: string; colorCode: string; priceModifier: number }[]> {
    try {
      const response = await apiClient.get(`/cars/${carId}/colors`);
      return response.data;
    } catch (error) {
      // Если API не поддерживает, возвращаем пустой массив
      return [];
    }
  },

  async getAvailableEngines(carId: number): Promise<{ engineId: number; engineName: string; engineCapacity: number; power: number; fuelType: string; priceModifier: number }[]> {
    try {
      const response = await apiClient.get(`/cars/${carId}/engines`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async getAvailableTransmissions(carId: number): Promise<{ transmissionId: number; transmissionName: string; transmissionType: string; gears: number; priceModifier: number }[]> {
    try {
      const response = await apiClient.get(`/cars/${carId}/transmissions`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async getColors(): Promise<{ name: string; hexCode: string }[]> {
    try {
      const response = await apiClient.get<{ name: string; hexCode: string }[]>('/cars/colors');
      return response.data;
    } catch (error) {
      console.error('Error loading colors:', error);
      return [];
    }
  },

  async deleteCar(carId: number): Promise<void> {
    await apiClient.delete(`/cars/${carId}`);
  },

  async updateCar(
    carId: number,
    updates: {
      color?: string;
      status?: string;
      vin?: string;
      mileage?: number;
      imageUrl?: string | null;
      imageUrls?: string[];
      condition?: string;
    }
  ): Promise<Car> {
    const response = await apiClient.put<Car>(`/cars/${carId}`, updates);
    return response.data;
  },

  async getCatalogListings(params?: {
    listingType?: 'New' | 'Used';
    brand?: string;
    bodyType?: string;
    search?: string;
    all?: boolean;
  }): Promise<Car[]> {
    const q = new URLSearchParams();
    if (params?.listingType) q.append('listingType', params.listingType);
    if (params?.brand) q.append('brand', params.brand);
    if (params?.bodyType) q.append('bodyType', params.bodyType);
    if (params?.search) q.append('search', params.search);
    if (params?.all) q.append('all', 'true');
    const response = await apiClient.get<Car[]>(`/cars/catalog?${q}`);
    return response.data;
  },

  async createCatalogListing(data: SaveCarListing): Promise<Car> {
    const response = await apiClient.post<Car>('/cars/catalog', data);
    return response.data;
  },

  async updateCatalogListing(carId: number, data: SaveCarListing): Promise<Car> {
    const response = await apiClient.put<Car>(`/cars/catalog/${carId}`, data);
    return response.data;
  },

  async deleteCatalogListing(carId: number): Promise<void> {
    await apiClient.delete(`/cars/catalog/${carId}`);
  },

  async createInventoryCar(data: {
    modelId: number;
    color: string;
    vin: string;
    status?: string;
    mileage?: number;
  }): Promise<Car> {
    const response = await apiClient.post<Car>('/cars/inventory', data);
    return response.data;
  },

  async uploadCatalogImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{ url: string }>('/cars/catalog/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  },
};