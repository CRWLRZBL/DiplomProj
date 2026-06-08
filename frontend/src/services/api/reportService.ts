import { apiClient } from './apiClient';

export const reportService = {
  async exportSalesReportPdf(
    startDate?: string,
    endDate?: string,
    brandId?: number,
    period?: 'month' | 'year' | 'custom'
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (brandId) params.append('brandId', brandId.toString());
    if (period) params.append('period', period);

    const response = await apiClient.get(`/reports/sales/export?${params}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

