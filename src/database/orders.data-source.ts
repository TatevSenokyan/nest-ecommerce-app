import { createDataSource } from './create-data-source';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OutboxMessage } from '../common/outbox/outbox.entity';

export default createDataSource(
  'DB_DATABASE_ORDERS',
  [Order, OrderItem, OutboxMessage],
  ['migrations/orders/*.ts'],
);
