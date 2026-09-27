import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

import { getRedisConnection } from '../microservice/redis-connection';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isTest = process.env.NODE_ENV === 'test';
        const ttlSeconds = Number(configService.get('THROTTLE_TTL', 60));
        const limit = Number(configService.get('THROTTLE_LIMIT', 60));

        return {
          throttlers: [
            {
              name: 'default',
              ttl: ttlSeconds * 1000,
              limit,
            },
          ],
          skipIf: () => isTest,
          ...(!isTest
            ? {
                storage: new ThrottlerStorageRedisService(
                  getRedisConnection(configService),
                ),
              }
            : {}),
        };
      },
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ThrottleModule {}
