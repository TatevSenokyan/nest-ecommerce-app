import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PRODUCT_SERVICE } from '../../common/constants/microservice.constants';
import { getRedisConnection } from '../../common/microservice/redis-connection';
import { ProductClientService } from './product-client.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: PRODUCT_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.REDIS,
          options: getRedisConnection(configService),
        }),
      },
    ]),
  ],
  providers: [ProductClientService],
  exports: [ProductClientService],
})
export class ProductClientModule {}
