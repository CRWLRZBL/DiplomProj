import { apiClient } from './apiClient';
import type { TestDriveSlot, BookTestDriveRequest, BookTestDriveResponse } from '../models/testDrive';

export const testDriveService = {
  async getSlots(dateUtc: string): Promise<TestDriveSlot[]> {
    const response = await apiClient.get<TestDriveSlot[]>(`/test-drives/slots?dateUtc=${encodeURIComponent(dateUtc)}`);
    return response.data;
  },

  async book(dto: BookTestDriveRequest): Promise<BookTestDriveResponse> {
    const response = await apiClient.post<BookTestDriveResponse>('/test-drives/book', dto);
    return response.data;
  },
};

