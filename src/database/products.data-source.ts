import { createDataSource } from './create-data-source';
import { Product } from '../products/product.entity';
import { StockReservation } from '../products/entities/stock-reservation.entity';
import { OutboxMessage } from '../common/outbox/outbox.entity';

export default createDataSource(
  'DB_DATABASE_PRODUCTS',
  [Product, StockReservation, OutboxMessage],
  ['migrations/products/*.ts'],
);
