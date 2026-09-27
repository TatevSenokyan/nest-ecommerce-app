import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Order } from './order.entity';
import { numericTransformer } from '../../common/transformers/numeric.transformer';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column()
  productId: number;

  @Column()
  productName: string;

  @Column()
  quantity: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  price: number;

  @ManyToOne(
    () => Order,
    (order) => order.items,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'orderId',
  })
  order: Order;
}
