import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

import { CacheInvalidationProcessor } from './invalidate-product-cache';
import { RedisModule } from '../common/redis/redis.module';
import { getRedisConnection } from '../common/microservice/redis-connection';

@Module({
  imports: [
    RedisModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: getRedisConnection(configService),
      }),
    }),
    BullModule.registerQueue({
      name: 'cache-invalidation',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  providers: [CacheInvalidationProcessor],
  exports: [BullModule],
})
export class JobsModule {}
