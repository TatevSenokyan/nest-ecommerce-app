import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';

import { Inject, Injectable } from '@nestjs/common';

import Redis from 'ioredis';

import { REDIS } from '../common/constants/redis.constants';

@Injectable()
export class RedisHealthIndicator
  extends HealthIndicator
{
  constructor(
    @Inject(REDIS)
    private readonly redis: Redis,
  ) {
    super();
  }

  async isHealthy(
    key: string,
  ): Promise<HealthIndicatorResult> {
    try {
      await this.redis.ping();

      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false),
      );
    }
  }
}
