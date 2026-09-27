import { createDataSource } from './create-data-source';
import { Payment } from '../payments/entities/payment.entity';
import { OutboxMessage } from '../common/outbox/outbox.entity';
import { InboxMessage } from '../common/inbox/inbox.entity';

export default createDataSource(
  'DB_DATABASE_PAYMENTS',
  [Payment, OutboxMessage, InboxMessage],
  ['migrations/payments/*.ts'],
);
