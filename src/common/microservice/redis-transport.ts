import { ConfigService } from '@nestjs/config';
import { RedisOptions, Transport } from '@nestjs/microservices';

import { getRedisConnection } from './redis-connection';

export const getRedisTransportOptions = (
  configService: ConfigService,
): RedisOptions => ({
  transport: Transport.REDIS,
  options: getRedisConnection(configService),
});
