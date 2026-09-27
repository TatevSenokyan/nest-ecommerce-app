import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { PaymentsService } from '../../payments/payments.service';
import { PaymentPatterns } from '../contracts/patterns';
import { InternalRpcPipe } from '../../common/microservice/internal-rpc.pipe';
import { toRpcException } from '../../common/microservice/rpc.util';
import { PaymentStatus } from '../../payments/entities/payment.entity';

@Controller()
@UsePipes(InternalRpcPipe)
export class PaymentsMicroserviceController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern(PaymentPatterns.CREATE)
  async create(data: {
    orderId: number;
    userId: number;
    amount: number;
    idempotencyKey: string;
  }) {
    try {
      return await this.paymentsService.create(data);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(PaymentPatterns.FIND_ONE)
  async findOne(data: { userId: number; paymentId: number }) {
    try {
      return await this.paymentsService.findOne(data.userId, data.paymentId);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(PaymentPatterns.FIND_BY_ORDER)
  async findByOrder(data: { userId: number; orderId: number }) {
    try {
      return await this.paymentsService.findByOrder(data.userId, data.orderId);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(PaymentPatterns.UPDATE_STATUS)
  async updateStatus(data: {
    userId: number;
    paymentId: number;
    status: PaymentStatus;
  }) {
    try {
      return await this.paymentsService.updateStatus(
        data.userId,
        data.paymentId,
        { status: data.status },
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }
}
