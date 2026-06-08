export interface Order {
  orderId: number;
  customerName: string;
  carModel: string;
  configuration: string;
  totalPrice: number;
  orderStatus: string;
  orderDate: string;
  options: OrderOption[];
}

export interface CreateOrderRequest {
  userId: number;
  carId?: number; // Опционально - если не указан, создается новый автомобиль
  modelId?: number; // Обязательно, если carId не указан
  configurationId: number;
  color?: string; // Цвет для нового автомобиля
  optionIds: number[];
}

export interface PricingQuoteRequest {
  carId?: number;
  modelId?: number;
  configurationId: number;
  color?: string;
  optionIds: number[];
}

export interface PricingQuoteLine {
  code: 'base' | 'configuration' | 'color' | 'option' | string;
  label: string;
  amount: number;
}

export interface PricingQuote {
  basePrice: number;
  configurationPrice: number;
  optionsPrice: number;
  colorPrice: number;
  totalPrice: number;
  lines: PricingQuoteLine[];
}

export interface ReserveCar24hRequest {
  userId: number;
  carId: number;
  configurationId?: number;
  color?: string;
  optionIds: number[];
}

export interface ReserveCar24hResponse {
  orderId: number;
  reservedUntil: string;
  quote: PricingQuote;
}

export interface OrderOption {
  optionName: string;
  price: number;
  quantity: number;
}