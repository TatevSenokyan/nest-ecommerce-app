import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import {
  OrderEvents,
  PaymentEvents,
} from '../contracts/events';
import type {
  OrderCancelledEvent,
  OrderConfirmedEvent,
  OrderCreatedEvent,
  OrderStockFailedEvent,
  PaymentFailedEvent,
  PaymentSucceededEvent,
} from '../contracts/events';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  @EventPattern(OrderEvents.CREATED)
  handleOrderCreated(@Payload() event: OrderCreatedEvent): void {
    this.logger.log(`Notification: order created ${JSON.stringify(event)}`);
  }

  @EventPattern(OrderEvents.CONFIRMED)
  handleOrderConfirmed(@Payload() event: OrderConfirmedEvent): void {
    this.logger.log(`Notification: order confirmed ${JSON.stringify(event)}`);
  }

  @EventPattern(OrderEvents.CANCELLED)
  handleOrderCancelled(@Payload() event: OrderCancelledEvent): void {
    this.logger.log(`Notification: order cancelled ${JSON.stringify(event)}`);
  }

  @EventPattern(OrderEvents.STOCK_FAILED)
  handleOrderStockFailed(@Payload() event: OrderStockFailedEvent): void {
    this.logger.log(`Notification: stock failed ${JSON.stringify(event)}`);
  }

  @EventPattern(PaymentEvents.SUCCEEDED)
  handlePaymentSucceeded(@Payload() event: PaymentSucceededEvent): void {
    this.logger.log(`Notification: payment succeeded ${JSON.stringify(event)}`);
  }

  @EventPattern(PaymentEvents.FAILED)
  handlePaymentFailed(@Payload() event: PaymentFailedEvent): void {
    this.logger.log(`Notification: payment failed ${JSON.stringify(event)}`);
  }
}
