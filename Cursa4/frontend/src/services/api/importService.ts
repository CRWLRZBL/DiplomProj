import { apiClient } from './apiClient';

export interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: string[];
  message: string;
}

export const importService = {
  async downloadTemplate(): Promise<Blob> {
    const response = await apiClient.get('/cars/import/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  async importCarsFromExcel(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ImportResult>('/cars/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

