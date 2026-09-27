import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  BadRequestException,
} from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderClientService } from '../microservices/orders/order-client.service';
import { PaymentClientService } from '../microservices/payments/payment-client.service';
import { OrderStatus } from './entities/order.entity';
import { PaymentStatus } from '../payments/entities/payment.entity';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orderClient: OrderClientService,
    private readonly paymentClient: PaymentClientService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderClient.create(user.userId, createOrderDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    if (updateOrderStatusDto.status === OrderStatus.CANCELLED) {
      const payment = await this.paymentClient.findByOrder(user.userId, id);

      if (payment?.status === PaymentStatus.SUCCEEDED) {
        throw new BadRequestException(
          'Cannot cancel an order that has a succeeded payment',
        );
      }
    }

    return this.orderClient.updateStatus(
      user.userId,
      id,
      updateOrderStatusDto,
    );
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.orderClient.findAll(user.userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.orderClient.findOne(user.userId, id);
  }
}
