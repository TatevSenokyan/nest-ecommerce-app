import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PAYMENT_SERVICE } from '../../common/constants/microservice.constants';
import { getRedisConnection } from '../../common/microservice/redis-connection';
import { PaymentClientService } from './payment-client.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: PAYMENT_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: getRedisConnection(configService),
        }),
      },
    ]),
  ],
  providers: [PaymentClientService],
  exports: [PaymentClientService],
})
export class PaymentClientModule {}
