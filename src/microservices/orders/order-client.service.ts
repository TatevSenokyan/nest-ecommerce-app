import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { ORDER_SERVICE } from '../../common/constants/microservice.constants';
import { sendCommand } from '../../common/microservice/rpc.util';
import { OrderPatterns } from '../contracts/patterns';
import { CreateOrderDto } from '../../orders/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../../orders/dto/update-order-status.dto';
import { Order } from '../../orders/entities/order.entity';

@Injectable()
export class OrderClientService {
  constructor(
    @Inject(ORDER_SERVICE)
    private readonly client: ClientProxy,
  ) {}

  create(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    return sendCommand(this.client, OrderPatterns.CREATE, {
      userId,
      ...createOrderDto,
    });
  }

  findAll(userId: number): Promise<Order[]> {
    return sendCommand(this.client, OrderPatterns.FIND_ALL, { userId });
  }

  findOne(userId: number, orderId: number): Promise<Order> {
    return sendCommand(this.client, OrderPatterns.FIND_ONE, {
      userId,
      orderId,
    });
  }

  updateStatus(
    userId: number,
    orderId: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    return sendCommand(this.client, OrderPatterns.UPDATE_STATUS, {
      userId,
      orderId,
      ...updateOrderStatusDto,
    });
  }
}
