import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS } from '../redis.constants';
import { getRedisConnection } from '../../microservice/redis-connection';

export const redisProvider = {
  provide: REDIS,

  inject: [ConfigService],

  useFactory: (configService: ConfigService) => {
    return new Redis(getRedisConnection(configService));
  },
};
