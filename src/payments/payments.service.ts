import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import {
  Payment,
  PaymentStatus,
} from './entities/payment.entity';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { PaymentProvider } from './providers/payment-provider';
import { writeOutbox } from '../common/outbox/outbox.writer';
import { PaymentEvents } from '../microservices/contracts/events';
import { InboxMessage } from '../common/inbox/inbox.entity';

export interface CreatePaymentCommand {
  orderId: number;
  userId: number;
  amount: number;
  idempotencyKey: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentProvider: PaymentProvider,
  ) {}

  async findOne(userId: number, paymentId: number): Promise<Payment> {
    const payment = await this.dataSource.getRepository(Payment).findOne({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${paymentId} not found`);
    }

    return payment;
  }

  async findByOrder(userId: number, orderId: number): Promise<Payment | null> {
    return this.dataSource.getRepository(Payment).findOne({
      where: { orderId, userId },
    });
  }

  async updateStatus(
    userId: number,
    paymentId: number,
    updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<Payment> {
    return this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { id: paymentId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!payment || payment.userId !== userId) {
        throw new NotFoundException(`Payment with id ${paymentId} not found`);
      }

      const currentStatus = payment.status;
      const newStatus = updatePaymentStatusDto.status;

      if (currentStatus === newStatus) {
        throw new BadRequestException(`Payment is already ${currentStatus}`);
      }

      const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
        [PaymentStatus.PENDING]: [PaymentStatus.PROCESSING],
        [PaymentStatus.PROCESSING]: [
          PaymentStatus.SUCCEEDED,
          PaymentStatus.FAILED,
        ],
        [PaymentStatus.SUCCEEDED]: [],
        [PaymentStatus.FAILED]: [],
      };

      if (!allowedTransitions[currentStatus].includes(newStatus)) {
        throw new BadRequestException(
          `Cannot change payment status from ${currentStatus} to ${newStatus}`,
        );
      }

      payment.status = newStatus;
      await manager.save(payment);

      if (newStatus === PaymentStatus.SUCCEEDED) {
        await writeOutbox(manager, PaymentEvents.SUCCEEDED, {
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
          amount: payment.amount,
        });
      }

      if (newStatus === PaymentStatus.FAILED) {
        await writeOutbox(manager, PaymentEvents.FAILED, {
          paymentId: payment.id,
          orderId: payment.orderId,
          userId: payment.userId,
          amount: payment.amount,
        });
      }

      return payment;
    });
  }

  async create(command: CreatePaymentCommand): Promise<Payment> {
    const existing = await this.dataSource.getRepository(Payment).findOne({
      where: { idempotencyKey: command.idempotencyKey },
    });

    if (existing && existing.status !== PaymentStatus.PROCESSING) {
      return existing;
    }

    let payment = existing;

    if (!payment) {
      try {
        payment = await this.dataSource.transaction(async (manager) => {
          const existingOrderPayment = await manager.findOne(Payment, {
            where: { orderId: command.orderId },
          });

          if (existingOrderPayment) {
            throw new BadRequestException('This order already has a payment');
          }

          const eventId = `payment.create:${command.idempotencyKey}`;
          const inbox = manager.create(InboxMessage, { eventId });
          await manager.save(inbox);

          const created = manager.create(Payment, {
            orderId: command.orderId,
            userId: command.userId,
            amount: command.amount,
            status: PaymentStatus.PROCESSING,
            provider: 'MOCK',
            idempotencyKey: command.idempotencyKey,
          });

          return manager.save(created);
        });
      } catch (error: unknown) {
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code?: string }).code === '23505'
        ) {
          const replay = await this.dataSource.getRepository(Payment).findOne({
            where: { idempotencyKey: command.idempotencyKey },
          });

          if (replay && replay.status !== PaymentStatus.PROCESSING) {
            return replay;
          }

          if (replay) {
            payment = replay;
          }
        }

        if (!payment) {
          throw error;
        }
      }
    }

    if (!payment) {
      throw new BadRequestException('Unable to create payment');
    }

    const charge = await this.paymentProvider.charge(Number(payment.amount));

    return this.dataSource.transaction(async (manager) => {
      const locked = await manager.findOne(Payment, {
        where: { id: payment.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!locked) {
        throw new NotFoundException(`Payment with id ${payment.id} not found`);
      }

      locked.status = charge.success
        ? PaymentStatus.SUCCEEDED
        : PaymentStatus.FAILED;
      await manager.save(locked);

      await writeOutbox(
        manager,
        charge.success ? PaymentEvents.SUCCEEDED : PaymentEvents.FAILED,
        {
          paymentId: locked.id,
          orderId: locked.orderId,
          userId: locked.userId,
          amount: locked.amount,
        },
      );

      return locked;
    });
  }
}
