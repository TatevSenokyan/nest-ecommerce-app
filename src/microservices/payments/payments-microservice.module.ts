import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentsModule } from '../../payments/payments.module';
import { PaymentsMicroserviceController } from './payments-microservice.controller';
import { createTypeOrmConfig } from '../../database/typeorm.config';
import { DB_DATABASE_PAYMENTS } from '../../common/constants/database.constants';
import { KafkaClientModule } from '../kafka/kafka-client.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmConfig(DB_DATABASE_PAYMENTS),
    }),
    KafkaClientModule.register('payments-microservice', 'payments-outbox-relay'),
    PaymentsModule,
  ],
  controllers: [PaymentsMicroserviceController],
})
export class PaymentsMicroserviceModule {}
