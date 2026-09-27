import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { PAYMENT_SERVICE } from '../../common/constants/microservice.constants';
import { sendCommand } from '../../common/microservice/rpc.util';
import { PaymentPatterns } from '../contracts/patterns';
import { Payment } from '../../payments/entities/payment.entity';
import { UpdatePaymentStatusDto } from '../../payments/dto/update-payment-status.dto';
import { CreatePaymentCommand } from '../../payments/payments.service';

@Injectable()
export class PaymentClientService {
  constructor(
    @Inject(PAYMENT_SERVICE)
    private readonly client: ClientProxy,
  ) {}

  create(command: CreatePaymentCommand): Promise<Payment> {
    return sendCommand(this.client, PaymentPatterns.CREATE, command);
  }

  findOne(userId: number, paymentId: number): Promise<Payment> {
    return sendCommand(this.client, PaymentPatterns.FIND_ONE, {
      userId,
      paymentId,
    });
  }

  findByOrder(userId: number, orderId: number): Promise<Payment | null> {
    return sendCommand(this.client, PaymentPatterns.FIND_BY_ORDER, {
      userId,
      orderId,
    });
  }

  updateStatus(
    userId: number,
    paymentId: number,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<Payment> {
    return sendCommand(this.client, PaymentPatterns.UPDATE_STATUS, {
      userId,
      paymentId,
      ...updatePaymentStatusDto,
    });
  }
}
