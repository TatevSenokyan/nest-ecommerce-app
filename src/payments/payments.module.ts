import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { PaymentProvider } from './providers/payment-provider';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { OutboxMessage } from '../common/outbox/outbox.entity';
import { InboxMessage } from '../common/inbox/inbox.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, OutboxMessage, InboxMessage])],
  providers: [
    PaymentsService,
    {
      provide: PaymentProvider,
      useClass: MockPaymentProvider,
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
