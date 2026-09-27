import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('outbox')
export class OutboxMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;
}
