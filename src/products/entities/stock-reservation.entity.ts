import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('stock_reservations')
@Unique(['orderId', 'productId'])
export class StockReservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @Column()
  productId: number;

  @Column({ type: 'integer' })
  quantity: number;
}
