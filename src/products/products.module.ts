import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './product.entity';
import { StockReservation } from './entities/stock-reservation.entity';
import { ProductsService } from './products.service';
import { RedisModule } from '../common/redis/redis.module';
import { JobsModule } from '../jobs/jobs.module';
import { OutboxMessage } from '../common/outbox/outbox.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, StockReservation, OutboxMessage]),
    RedisModule,
    JobsModule,
  ],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
