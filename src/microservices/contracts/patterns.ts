export const ProductPatterns = {
  GET: 'product.get',
  GET_ALL: 'product.get-all',
  CREATE: 'product.create',
  UPDATE: 'product.update',
  RESERVE_STOCK: 'product.reserve-stock',
  RELEASE_STOCK: 'product.release-stock',
} as const;

export const OrderPatterns = {
  CREATE: 'order.create',
  FIND_ALL: 'order.find-all',
  FIND_ONE: 'order.find-one',
  UPDATE_STATUS: 'order.update-status',
} as const;

export const PaymentPatterns = {
  CREATE: 'payment.create',
  FIND_ONE: 'payment.find-one',
  FIND_BY_ORDER: 'payment.find-by-order',
  UPDATE_STATUS: 'payment.update-status',
} as const;
