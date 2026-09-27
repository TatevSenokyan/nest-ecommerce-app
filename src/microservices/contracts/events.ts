export const OrderEvents = {
  CREATED: 'order.created',
  CONFIRMED: 'order.confirmed',
  CANCELLED: 'order.cancelled',
  STOCK_FAILED: 'order.stock_failed',
} as const;

export const PaymentEvents = {
  SUCCEEDED: 'payment.succeeded',
  FAILED: 'payment.failed',
} as const;

export interface OrderCreatedEvent {
  orderId: number;
  userId: number;
  total: number;
}

export interface OrderConfirmedEvent {
  orderId: number;
  userId: number;
  amount: number;
}

export interface OrderCancelledEvent {
  orderId: number;
  userId: number;
}

export interface OrderStockFailedEvent {
  orderId: number;
  userId: number;
  reason: string;
}

export interface PaymentSucceededEvent {
  paymentId: number;
  orderId: number;
  userId: number;
  amount: number;
}

export interface PaymentFailedEvent {
  paymentId: number;
  orderId: number;
  userId: number;
  amount: number;
}
