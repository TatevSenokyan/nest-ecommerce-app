import {
  Controller,
  Get,
} from '@nestjs/common';

import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

import { SkipThrottle } from '@nestjs/throttler';

import { RedisHealthIndicator } from './redis.health';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,

    private readonly db: TypeOrmHealthIndicator,

    private readonly redis: RedisHealthIndicator,
  ) {}

  @Public()
  @SkipThrottle()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () =>
        this.db.pingCheck(
          'database',
        ),

      () =>
        this.redis.isHealthy(
          'redis',
        ),
    ]);
  }
}
