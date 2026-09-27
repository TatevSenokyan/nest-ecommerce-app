import {
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('inbox')
export class InboxMessage {
  @PrimaryColumn()
  eventId: string;

  @CreateDateColumn()
  processedAt: Date;
}
