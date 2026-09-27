import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import Redis from 'ioredis';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { DataSource } from 'typeorm';

import { Product } from './product.entity';
import { StockReservation } from './entities/stock-reservation.entity';
import { REDIS } from '../common/constants/redis.constants';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

@Injectable()
export class ProductsService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(REDIS)
    private readonly redis: Redis,
    @InjectQueue('cache-invalidation')
    private readonly cacheInvalidationQueue: Queue,
  ) {}

  private readonly logger = new Logger(ProductsService.name);

  async findAll(): Promise<Product[]> {
    return this.dataSource.getRepository(Product).find();
  }

  async findOne(productId: number): Promise<Product> {
    const cacheKey = `product:${productId}`;

    let cachedProduct: string | null = null;

    try {
      cachedProduct = await this.redis.get(cacheKey);
    } catch (error) {
      console.error('Redis GET failed:', error);
    }

    if (cachedProduct) {
      return JSON.parse(cachedProduct);
    }

    const product = await this.dataSource.getRepository(Product).findOne({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    try {
      await this.redis.set(cacheKey, JSON.stringify(product), 'EX', 60);
    } catch (error) {
      console.error('Redis SET failed:', error);
    }

    return product;
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    const product = this.dataSource.getRepository(Product).create(data);

    return this.dataSource.getRepository(Product).save(product);
  }

  async decreaseStock(productId: number, quantity: number): Promise<Product> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const updatedProduct = await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: {
          id: productId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!product) {
        throw new NotFoundException(`Product with id ${productId} not found`);
      }

      if (product.stock < quantity) {
        throw new BadRequestException('Not enough stock');
      }

      product.stock -= quantity;

      return manager.save(product);
    });

    await this.invalidateProductCache(productId);

    return updatedProduct;
  }

  async reserveStock(
    orderId: number,
    productId: number,
    quantity: number,
  ): Promise<Product> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const updatedProduct = await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(StockReservation, {
        where: {
          orderId,
          productId,
        },
      });

      if (existing) {
        const product = await manager.findOne(Product, {
          where: { id: productId },
        });

        if (!product) {
          throw new NotFoundException(`Product with id ${productId} not found`);
        }

        return product;
      }

      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Product with id ${productId} not found`);
      }

      if (product.stock < quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${product.name}`,
        );
      }

      product.stock -= quantity;
      await manager.save(product);

      const reservation = manager.create(StockReservation, {
        orderId,
        productId,
        quantity,
      });
      await manager.save(reservation);

      return product;
    });

    await this.invalidateProductCache(productId);

    return updatedProduct;
  }

  async releaseStock(
    orderId: number,
    productId: number,
    quantity: number,
  ): Promise<Product> {
    const updatedProduct = await this.dataSource.transaction(async (manager) => {
      const reservation = await manager.findOne(StockReservation, {
        where: {
          orderId,
          productId,
        },
      });

      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException(`Product with id ${productId} not found`);
      }

      if (!reservation) {
        return product;
      }

      product.stock += reservation.quantity ?? quantity;
      await manager.save(product);
      await manager.remove(reservation);

      return product;
    });

    await this.invalidateProductCache(productId);

    return updatedProduct;
  }

  async updateProduct(
    productId: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const repository = this.dataSource.getRepository(Product);

    const product = await repository.findOne({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    if (product.version !== updateProductDto.version) {
      throw new BadRequestException('Product was modified by another user');
    }

    product.name = updateProductDto.name ?? product.name;
    product.price = updateProductDto.price ?? product.price;

    const updatedProduct = await repository.save(product);

    await this.invalidateProductCache(productId);

    return updatedProduct;
  }

  private async invalidateProductCache(productId: number): Promise<void> {
    try {
      await this.redis.del(`product:${productId}`);
    } catch (error) {
      this.logger.error(
        `Redis cache invalidation failed for product ${productId}`,
        error,
      );

      await this.cacheInvalidationQueue.add(
        'invalidate-product-cache',
        { productId },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      );
    }
  }
}
