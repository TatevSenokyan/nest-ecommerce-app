import { Module } from '@nestjs/common';

import { OrdersController } from './orders.controller';
import { OrderClientModule } from '../microservices/orders/order-client.module';
import { PaymentClientModule } from '../microservices/payments/payment-client.module';

@Module({
  imports: [OrderClientModule, PaymentClientModule],
  controllers: [OrdersController],
})
export class OrdersApiModule {}
