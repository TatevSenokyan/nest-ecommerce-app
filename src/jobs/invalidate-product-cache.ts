import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import Redis from 'ioredis';
import { Inject } from '@nestjs/common';

import { REDIS } from '../common/constants/redis.constants';

@Processor('cache-invalidation')
export class CacheInvalidationProcessor extends WorkerHost {
  constructor(
    @Inject(REDIS)
    private readonly redis: Redis,
  ) {
    super();
  }

  async process(
    job: Job<{ productId: number }>,
  ): Promise<void> {
    console.log(
      `Processing job ${job.id}: ${job.name}`,
    );

    const { productId } = job.data;

    await this.redis.del(`product:${productId}`);

    console.log(
      `Cache invalidated for product ${productId}`,
    );
  }
}
