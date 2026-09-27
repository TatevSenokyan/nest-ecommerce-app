import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { OrdersService } from '../../orders/orders.service';
import { OrderPatterns } from '../contracts/patterns';
import { InternalRpcPipe } from '../../common/microservice/internal-rpc.pipe';
import { toRpcException } from '../../common/microservice/rpc.util';
import { CreateOrderItemDto } from '../../orders/dto/create-order-item.dto';
import { OrderStatus } from '../../orders/entities/order.entity';

@Controller()
@UsePipes(InternalRpcPipe)
export class OrdersMicroserviceController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern(OrderPatterns.CREATE)
  async create(data: { userId: number; items: CreateOrderItemDto[] }) {
    try {
      return await this.ordersService.create(data.userId, {
        items: data.items,
      });
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(OrderPatterns.FIND_ALL)
  async findAll(data: { userId: number }) {
    try {
      return await this.ordersService.findAll(data.userId);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(OrderPatterns.FIND_ONE)
  async findOne(data: { userId: number; orderId: number }) {
    try {
      return await this.ordersService.findOne(data.userId, data.orderId);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(OrderPatterns.UPDATE_STATUS)
  async updateStatus(data: {
    userId: number;
    orderId: number;
    status: OrderStatus;
  }) {
    try {
      return await this.ordersService.updateStatus(data.userId, data.orderId, {
        status: data.status,
      });
    } catch (error) {
      throw toRpcException(error);
    }
  }
}
