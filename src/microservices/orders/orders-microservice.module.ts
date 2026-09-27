import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersModule } from '../../orders/orders.module';
import { OrdersMicroserviceController } from './orders-microservice.controller';
import { createTypeOrmConfig } from '../../database/typeorm.config';
import { DB_DATABASE_ORDERS } from '../../common/constants/database.constants';
import { KafkaClientModule } from '../kafka/kafka-client.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmConfig(DB_DATABASE_ORDERS),
    }),
    KafkaClientModule.register('orders-microservice', 'orders-outbox-relay'),
    OrdersModule,
  ],
  controllers: [OrdersMicroserviceController],
})
export class OrdersMicroserviceModule {}
