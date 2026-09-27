import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import { OrdersService } from './orders.service';
import { ProductClientService } from '../microservices/product/product-client.service';
import { OrderStatus, SagaStep } from './entities/order.entity';

describe('OrdersService', () => {
  let service: OrdersService;

  const productClientMock = {
    getProduct: jest.fn(),
    reserveStock: jest.fn(),
    releaseStock: jest.fn(),
  };

  const managerMock = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const dataSourceMock = {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    dataSourceMock.transaction.mockImplementation(async (callback) =>
      callback(managerMock),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: ProductClientService,
          useValue: productClientMock,
        },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it('should create an order, reserve stock, and write order.created outbox', async () => {
    const product = {
      id: 1,
      name: 'Laptop',
      price: 100,
      stock: 5,
    };

    productClientMock.getProduct.mockResolvedValue(product);
    productClientMock.reserveStock.mockResolvedValue({
      ...product,
      stock: 4,
    });

    const createdOrder = {
      id: 10,
      userId: 7,
      status: OrderStatus.PENDING,
      sagaStep: SagaStep.CREATED,
      total: 0,
      items: [],
    };

    managerMock.create.mockImplementation((_entity, value) => ({
      ...createdOrder,
      ...value,
    }));
    managerMock.save.mockImplementation(async (value) => {
      if (Array.isArray(value)) {
        return value;
      }

      return {
        ...createdOrder,
        ...value,
        id: 10,
        total: value.total ?? createdOrder.total,
      };
    });
    managerMock.findOne.mockResolvedValue({
      ...createdOrder,
      total: 100,
      items: [
        {
          productId: 1,
          productName: 'Laptop',
          quantity: 1,
          price: 100,
        },
      ],
    });

    const result = await service.create(7, {
      items: [{ productId: 1, quantity: 1 }],
    });

    expect(productClientMock.getProduct).toHaveBeenCalledWith(1);
    expect(productClientMock.reserveStock).toHaveBeenCalledWith(10, 1, 1);
    expect(result.sagaStep).toBe(SagaStep.STOCK_RESERVED);
    expect(managerMock.save).toHaveBeenCalled();
  });

  it('should compensate reserved items when a later reserve fails', async () => {
    productClientMock.getProduct
      .mockResolvedValueOnce({
        id: 1,
        name: 'A',
        price: 10,
        stock: 5,
      })
      .mockResolvedValueOnce({
        id: 2,
        name: 'B',
        price: 10,
        stock: 5,
      });

    productClientMock.reserveStock
      .mockResolvedValueOnce({ id: 1, stock: 4 })
      .mockRejectedValueOnce(new BadRequestException('Not enough stock'));

    productClientMock.releaseStock.mockResolvedValue({ id: 1, stock: 5 });

    managerMock.create.mockImplementation((_entity, value) => ({
      id: 11,
      userId: 7,
      status: OrderStatus.PENDING,
      sagaStep: SagaStep.CREATED,
      total: 0,
      items: [],
      ...value,
    }));
    managerMock.save.mockImplementation(async (value) => value);
    managerMock.findOne.mockResolvedValue({
      id: 11,
      userId: 7,
      status: OrderStatus.PENDING,
      sagaStep: SagaStep.CREATED,
    });

    await expect(
      service.create(7, {
        items: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 1 },
        ],
      }),
    ).rejects.toThrow('Not enough stock');

    expect(productClientMock.releaseStock).toHaveBeenCalledWith(11, 1, 1);
    expect(managerMock.findOne).toHaveBeenCalled();
  });
});
