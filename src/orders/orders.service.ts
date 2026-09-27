import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ProductClientService } from '../microservices/product/product-client.service';
import { Order, OrderStatus, SagaStep } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { writeOutbox } from '../common/outbox/outbox.writer';
import { OrderEvents } from '../microservices/contracts/events';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly productClient: ProductClientService,
  ) {}

  async create(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    const productIds = createOrderDto.items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);

    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestException('Duplicate products are not allowed');
    }

    const items = [...createOrderDto.items].sort(
      (a, b) => a.productId - b.productId,
    );

    const snapshots: Array<{
      productId: number;
      productName: string;
      quantity: number;
      price: number;
    }> = [];

    for (const item of items) {
      const product = await this.productClient.getProduct(item.productId);

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${product.name}`,
        );
      }

      snapshots.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: Number(product.price),
      });
    }

    const order = await this.dataSource.transaction(async (manager) => {
      const created = manager.create(Order, {
        userId,
        status: OrderStatus.PENDING,
        sagaStep: SagaStep.CREATED,
        total: 0,
      });
      await manager.save(created);

      const orderItems: OrderItem[] = [];
      let total = 0;

      for (const snapshot of snapshots) {
        total += snapshot.price * snapshot.quantity;
        orderItems.push(
          manager.create(OrderItem, {
            orderId: created.id,
            productId: snapshot.productId,
            productName: snapshot.productName,
            quantity: snapshot.quantity,
            price: snapshot.price,
          }),
        );
      }

      await manager.save(orderItems);
      created.total = total;
      created.items = orderItems;
      await manager.save(created);

      return created;
    });

    const reserved: Array<{ productId: number; quantity: number }> = [];

    try {
      for (const item of snapshots) {
        await this.productClient.reserveStock(
          order.id,
          item.productId,
          item.quantity,
        );
        reserved.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }
    } catch (error) {
      for (const item of reserved) {
        await this.productClient.releaseStock(
          order.id,
          item.productId,
          item.quantity,
        );
      }

      await this.dataSource.transaction(async (manager) => {
        const failed = await manager.findOne(Order, {
          where: { id: order.id },
        });

        if (failed) {
          failed.status = OrderStatus.CANCELLED;
          failed.sagaStep = SagaStep.STOCK_FAILED;
          await manager.save(failed);
          await writeOutbox(manager, OrderEvents.STOCK_FAILED, {
            orderId: failed.id,
            userId: failed.userId,
            reason:
              error instanceof Error ? error.message : 'Stock reservation failed',
          });
        }
      });

      throw error;
    }

    return this.dataSource.transaction(async (manager) => {
      const reservedOrder = await manager.findOne(Order, {
        where: { id: order.id },
        relations: { items: true },
      });

      if (!reservedOrder) {
        throw new NotFoundException(`Order with id ${order.id} not found`);
      }

      reservedOrder.sagaStep = SagaStep.STOCK_RESERVED;
      await manager.save(reservedOrder);
      await writeOutbox(manager, OrderEvents.CREATED, {
        orderId: reservedOrder.id,
        userId: reservedOrder.userId,
        total: reservedOrder.total,
      });

      return reservedOrder;
    });
  }

  async findAll(userId: number): Promise<Order[]> {
    return this.dataSource.getRepository(Order).find({
      where: { userId },
      relations: { items: true },
      order: { id: 'DESC' },
    });
  }

  async findOne(userId: number, orderId: number): Promise<Order> {
    const order = await this.dataSource.getRepository(Order).findOne({
      where: {
        id: orderId,
        userId,
      },
      relations: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    return order;
  }

  async updateStatus(
    userId: number,
    orderId: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.dataSource.transaction(async (manager) => {
      const locked = await manager.findOne(Order, {
        where: {
          id: orderId,
          userId,
        },
        relations: { items: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!locked) {
        throw new NotFoundException(`Order with id ${orderId} not found`);
      }

      const newStatus = updateOrderStatusDto.status;

      if (locked.status === newStatus) {
        throw new BadRequestException(`Order is already ${locked.status}`);
      }

      if (
        locked.status === OrderStatus.PENDING &&
        newStatus === OrderStatus.CONFIRMED
      ) {
        locked.status = OrderStatus.CONFIRMED;
        locked.sagaStep = SagaStep.CONFIRMED;
        await manager.save(locked);
        await writeOutbox(manager, OrderEvents.CONFIRMED, {
          orderId: locked.id,
          userId: locked.userId,
          amount: locked.total,
        });
        return locked;
      }

      if (
        locked.status === OrderStatus.PENDING &&
        newStatus === OrderStatus.CANCELLED
      ) {
        locked.status = OrderStatus.CANCELLED;
        await manager.save(locked);
        await writeOutbox(manager, OrderEvents.CANCELLED, {
          orderId: locked.id,
          userId: locked.userId,
        });
        return locked;
      }

      throw new BadRequestException(
        `Cannot change order status from ${locked.status} to ${newStatus}`,
      );
    });

    if (order.status === OrderStatus.CANCELLED) {
      const items = [...order.items].sort((a, b) => a.productId - b.productId);

      for (const item of items) {
        await this.productClient.releaseStock(
          order.id,
          item.productId,
          item.quantity,
        );
      }
    }

    return order;
  }
}
