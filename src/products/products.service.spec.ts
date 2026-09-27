import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bullmq';

import { ProductsService } from './products.service';
import { REDIS } from '../common/constants/redis.constants';
import { Product } from './product.entity';

describe('ProductsService', () => {
  let service: ProductsService;

  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const transactionManagerMock = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  const productRepositoryMock = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const dataSourceMock = {
    getRepository: jest.fn(),
    transaction: jest.fn(),
  };

  const cacheInvalidationQueueMock = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    dataSourceMock.getRepository.mockReturnValue(
      productRepositoryMock,
    );

  dataSourceMock.transaction.mockImplementation(
    async (callback) => {
      return callback(transactionManagerMock);
    },
  );


    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ProductsService,
          {
            provide: DataSource,
            useValue: dataSourceMock,
          },
          {
            provide: REDIS,
            useValue: redisMock,
          },
          {
            provide: getQueueToken('cache-invalidation'),
            useValue: cacheInvalidationQueueMock,
          },
        ],
      }).compile();

    service = module.get<ProductsService>(
      ProductsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return product from Redis cache', async () => {
    const product = {
      id: 1,
      name: 'Laptop',
      price: 1200,
      stock: 10,
    };

    redisMock.get.mockResolvedValue(
      JSON.stringify(product),
    );

    const result = await service.findOne(1);

    expect(result).toEqual(product);

    expect(redisMock.get).toHaveBeenCalledWith(
      'product:1',
    );

    expect(
      productRepositoryMock.findOne,
    ).not.toHaveBeenCalled();
  });
  it('should fetch product from database and cache it when Redis misses', async () => {
    const product = {
      id: 1,
      name: 'Laptop',
      price: 1200,
      stock: 10,
    };

    redisMock.get.mockResolvedValue(null);

    productRepositoryMock.findOne.mockResolvedValue(
      product,
    );

    const result = await service.findOne(1);

    expect(result).toEqual(product);

    expect(redisMock.get).toHaveBeenCalledWith(
      'product:1',
    );

    expect(
      productRepositoryMock.findOne,
    ).toHaveBeenCalled();

    expect(redisMock.set).toHaveBeenCalledWith(
      'product:1',
      JSON.stringify(product),
      'EX',
      60,
    );
  });

  it('should throw NotFoundException when product is not found', async () => {
    redisMock.get.mockResolvedValue(null);

    productRepositoryMock.findOne.mockResolvedValue(
      null,
    );

    await expect(
      service.findOne(999),
    ).rejects.toThrow('Product with id 999 not found');
  });
  it('should fetch product from database when Redis fails', async () => {
    const product = {
      id: 1,
      name: 'Laptop',
      price: 1200,
      stock: 10,
    };

    redisMock.get.mockRejectedValue(
      new Error('Redis unavailable'),
    );

    productRepositoryMock.findOne.mockResolvedValue(
      product,
    );

    const result = await service.findOne(1);

    expect(result).toEqual(product);

    expect(
      productRepositoryMock.findOne,
    ).toHaveBeenCalled();
  });

    it('should update product and invalidate its Redis cache', async () => {
      const product = {
        id: 1,
        name: 'Laptop',
        price: 1200,
        stock: 10,
        version: 1,
      };

      const updateProductDto = {
        name: 'Gaming Laptop',
        price: 1500,
        version: 1,
      };

      const updatedProduct = {
        ...product,
        name: 'Gaming Laptop',
        price: 1500,
        version: 2,
      };

      productRepositoryMock.findOne.mockResolvedValue(
        product,
      );

      productRepositoryMock.save.mockResolvedValue(
        updatedProduct,
      );

      redisMock.del.mockResolvedValue(1);

      const result = await service.updateProduct(
        1,
        updateProductDto,
      );

      expect(result).toEqual(updatedProduct);

      expect(
        productRepositoryMock.findOne,
      ).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });

      expect(
        productRepositoryMock.save,
      ).toHaveBeenCalledWith(product);

      expect(redisMock.del).toHaveBeenCalledWith(
        'product:1',
      );
    });
    it('should queue cache invalidation when Redis fails', async () => {
      const product = {
        id: 1,
        name: 'Laptop',
        price: 1200,
        stock: 10,
        version: 1,
      };

      const updateProductDto = {
        name: 'Gaming Laptop',
        version: 1,
      };

      const updatedProduct = {
        ...product,
        name: 'Gaming Laptop',
        version: 2,
      };

      productRepositoryMock.findOne.mockResolvedValue(
        product,
      );

      productRepositoryMock.save.mockResolvedValue(
        updatedProduct,
      );

      redisMock.del.mockRejectedValue(
        new Error('Redis unavailable'),
      );

      cacheInvalidationQueueMock.add.mockResolvedValue(
        {},
      );

      const result = await service.updateProduct(
        1,
        updateProductDto,
      );

      expect(result).toEqual(updatedProduct);

      expect(redisMock.del).toHaveBeenCalledWith(
        'product:1',
      );

      expect(
        cacheInvalidationQueueMock.add,
      ).toHaveBeenCalledWith(
        'invalidate-product-cache',
        {
          productId: 1,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    });

  it('should decrease product stock inside a transaction', async () => {
    const product = {
      id: 1,
      name: 'Laptop',
      price: 1200,
      stock: 10,
      version: 1,
    };

    const updatedProduct = {
      ...product,
      stock: 7,
    };

    transactionManagerMock.findOne.mockResolvedValue(
      product,
    );

    transactionManagerMock.save.mockResolvedValue(
      updatedProduct,
    );

    redisMock.del.mockResolvedValue(1);

    const result = await service.decreaseStock(
      1,
      3,
    );

    expect(result).toEqual(updatedProduct);

    expect(
      transactionManagerMock.findOne,
    ).toHaveBeenCalledWith(
      Product,
      {
        where: {
          id: 1,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      },
    );

    expect(
      transactionManagerMock.save,
    ).toHaveBeenCalledWith(product);

    expect(redisMock.del).toHaveBeenCalledWith(
      'product:1',
    );

    expect(
      dataSourceMock.transaction,
    ).toHaveBeenCalled();
  });


  it('should throw BadRequestException when quantity is not positive', async () => {
    await expect(
      service.decreaseStock(1, 0),
    ).rejects.toThrow(
      'Quantity must be greater than 0',
    );

    expect(
      dataSourceMock.transaction,
    ).not.toHaveBeenCalled();

    expect(
      redisMock.del,
    ).not.toHaveBeenCalled();
  });

  it('should reserve stock once and stay idempotent for the same order', async () => {
    const product = {
      id: 1,
      name: 'Laptop',
      price: 1200,
      stock: 10,
    };

    transactionManagerMock.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce({ orderId: 9, productId: 1, quantity: 2 })
      .mockResolvedValueOnce({ ...product, stock: 8 });

    transactionManagerMock.save.mockImplementation(async (value) => value);
    transactionManagerMock.create.mockImplementation((_entity, value) => value);
    redisMock.del.mockResolvedValue(1);

    const first = await service.reserveStock(9, 1, 2);
    expect(first.stock).toBe(8);

    const second = await service.reserveStock(9, 1, 2);
    expect(second.stock).toBe(8);
  });

  it('should release reserved stock and ignore a second release', async () => {
    const product = {
      id: 1,
      name: 'Laptop',
      price: 1200,
      stock: 8,
    };

    transactionManagerMock.findOne
      .mockResolvedValueOnce({ orderId: 9, productId: 1, quantity: 2 })
      .mockResolvedValueOnce(product)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...product, stock: 10 });

    transactionManagerMock.save.mockImplementation(async (value) => value);
    transactionManagerMock.remove.mockResolvedValue({});
    redisMock.del.mockResolvedValue(1);

    const first = await service.releaseStock(9, 1, 2);
    expect(first.stock).toBe(10);
    expect(transactionManagerMock.remove).toHaveBeenCalled();

    const second = await service.releaseStock(9, 1, 2);
    expect(second.stock).toBe(10);
  });
});

