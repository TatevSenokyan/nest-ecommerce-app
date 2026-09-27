import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { ORDER_SERVICE } from '../../common/constants/microservice.constants';
import { getRedisConnection } from '../../common/microservice/redis-connection';
import { OrderClientService } from './order-client.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ORDER_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: getRedisConnection(configService),
        }),
      },
    ]),
  ],
  providers: [OrderClientService],
  exports: [OrderClientService],
})
export class OrderClientModule {}
