import { Module } from '@nestjs/common';

import { PaymentsController } from './payments.controller';
import { PaymentClientModule } from '../microservices/payments/payment-client.module';
import { OrderClientModule } from '../microservices/orders/order-client.module';

@Module({
  imports: [PaymentClientModule, OrderClientModule],
  controllers: [PaymentsController],
})
export class PaymentsApiModule {}
