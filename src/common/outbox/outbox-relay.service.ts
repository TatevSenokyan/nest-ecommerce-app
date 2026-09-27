import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { DataSource, IsNull } from 'typeorm';
import { firstValueFrom } from 'rxjs';

import { KAFKA_SERVICE } from '../constants/microservice.constants';
import { OutboxMessage } from './outbox.entity';

@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly dataSource: DataSource,
    @Inject(KAFKA_SERVICE)
    private readonly kafka: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.kafka.connect();
    this.timer = setInterval(() => {
      this.flush().catch((error: unknown) => {
        this.logger.error('Outbox flush failed', error);
      });
    }, 2000);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async flush(): Promise<void> {
    const repository = this.dataSource.getRepository(OutboxMessage);
    const rows = await repository.find({
      where: { publishedAt: IsNull() },
      take: 50,
      order: { id: 'ASC' },
    });

    for (const row of rows) {
      await firstValueFrom(this.kafka.emit(row.eventType, row.payload));
      row.publishedAt = new Date();
      await repository.save(row);
    }
  }
}
