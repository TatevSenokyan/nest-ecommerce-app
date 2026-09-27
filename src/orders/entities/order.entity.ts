import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { OrderItem } from './order-item.entity';
import { numericTransformer } from '../../common/transformers/numeric.transformer';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum SagaStep {
  CREATED = 'CREATED',
  STOCK_RESERVED = 'STOCK_RESERVED',
  STOCK_FAILED = 'STOCK_FAILED',
  CONFIRMED = 'CONFIRMED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: SagaStep,
    default: SagaStep.CREATED,
  })
  sagaStep: SagaStep;

  @OneToMany(
    () => OrderItem,
    (orderItem) => orderItem.order,
    {
      cascade: true,
    },
  )
  items: OrderItem[];

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: numericTransformer,
  })
  total: number;
}
