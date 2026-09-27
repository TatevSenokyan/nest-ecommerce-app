import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  VersionColumn,
} from 'typeorm';

import { numericTransformer } from '../common/transformers/numeric.transformer';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  price: number;

  @Column({ type: 'integer' })
  stock: number;

  @VersionColumn()
  version: number;
}
