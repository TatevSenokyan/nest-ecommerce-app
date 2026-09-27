import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentClientService } from '../microservices/payments/payment-client.service';
import { OrderClientService } from '../microservices/orders/order-client.service';
import { OrderStatus } from '../orders/entities/order.entity';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentClient: PaymentClientService,
    private readonly orderClient: OrderClientService,
  ) {}

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paymentClient.findOne(user.userId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    return this.paymentClient.updateStatus(
      user.userId,
      id,
      updatePaymentStatusDto,
    );
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    const order = await this.orderClient.findOne(
      user.userId,
      createPaymentDto.orderId,
    );

    if (!order) {
      throw new NotFoundException(
        `Order with id ${createPaymentDto.orderId} not found`,
      );
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed orders can be paid');
    }

    return this.paymentClient.create({
      orderId: order.id,
      userId: user.userId,
      amount: Number(order.total),
      idempotencyKey: createPaymentDto.idempotencyKey,
    });
  }
}
