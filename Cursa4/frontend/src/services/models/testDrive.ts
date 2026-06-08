export type TestDriveRouteType = 'city' | 'highway' | 'offroad';

export interface TestDriveSlot {
  startsAtUtc: string;
  durationMinutes: number;
}

export interface BookTestDriveRequest {
  userId: number;
  carId: number;
  startsAtUtc: string;
  routeType: TestDriveRouteType;
  childSeat: boolean;
  notes?: string;
}

export interface BookTestDriveResponse {
  orderId: number;
  startsAtUtc: string;
  durationMinutes: number;
}

