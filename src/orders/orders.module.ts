import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductClientModule } from '../microservices/product/product-client.module';
import { OutboxMessage } from '../common/outbox/outbox.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OutboxMessage]),
    ProductClientModule,
  ],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
