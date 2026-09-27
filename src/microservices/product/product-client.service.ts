import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { PRODUCT_SERVICE } from '../../common/constants/microservice.constants';
import { sendCommand } from '../../common/microservice/rpc.util';
import { ProductPatterns } from '../contracts/patterns';
import { CreateProductDto } from '../../products/dto/create-product.dto';
import { UpdateProductDto } from '../../products/dto/update-product.dto';
import { Product } from '../../products/product.entity';

@Injectable()
export class ProductClientService {
  constructor(
    @Inject(PRODUCT_SERVICE)
    private readonly client: ClientProxy,
  ) {}

  getProduct(productId: number): Promise<Product> {
    return sendCommand(this.client, ProductPatterns.GET, { productId });
  }

  getAll(): Promise<Product[]> {
    return sendCommand(this.client, ProductPatterns.GET_ALL, {});
  }

  create(data: CreateProductDto): Promise<Product> {
    return sendCommand(this.client, ProductPatterns.CREATE, data);
  }

  update(productId: number, data: UpdateProductDto): Promise<Product> {
    return sendCommand(this.client, ProductPatterns.UPDATE, {
      productId,
      ...data,
    });
  }

  reserveStock(
    orderId: number,
    productId: number,
    quantity: number,
  ): Promise<Product> {
    return sendCommand(this.client, ProductPatterns.RESERVE_STOCK, {
      orderId,
      productId,
      quantity,
    });
  }

  releaseStock(
    orderId: number,
    productId: number,
    quantity: number,
  ): Promise<Product> {
    return sendCommand(this.client, ProductPatterns.RELEASE_STOCK, {
      orderId,
      productId,
      quantity,
    });
  }
}
