import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @IsPositive()
  orderId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  idempotencyKey: string;
}

