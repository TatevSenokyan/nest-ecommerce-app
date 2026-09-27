import { EntityManager } from 'typeorm';

import { OutboxMessage } from './outbox.entity';

export const writeOutbox = async (
  manager: EntityManager,
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> => {
  const row = manager.create(OutboxMessage, {
    eventType,
    payload,
    publishedAt: null,
  });

  await manager.save(row);
};
