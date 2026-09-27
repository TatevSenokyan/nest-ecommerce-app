import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import { ProductsService } from '../../products/products.service';
import { ProductPatterns } from '../contracts/patterns';
import { InternalRpcPipe } from '../../common/microservice/internal-rpc.pipe';
import { toRpcException } from '../../common/microservice/rpc.util';
import { CreateProductDto } from '../../products/dto/create-product.dto';
import { UpdateProductDto } from '../../products/dto/update-product.dto';

@Controller()
@UsePipes(InternalRpcPipe)
export class ProductMicroserviceController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern(ProductPatterns.GET)
  async getProduct(data: { productId: number }) {
    try {
      return await this.productsService.findOne(data.productId);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(ProductPatterns.GET_ALL)
  async getAll() {
    try {
      return await this.productsService.findAll();
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(ProductPatterns.CREATE)
  async create(data: CreateProductDto) {
    try {
      return await this.productsService.createProduct(data);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(ProductPatterns.UPDATE)
  async update(data: UpdateProductDto & { productId: number }) {
    try {
      const { productId, ...dto } = data;
      return await this.productsService.updateProduct(productId, dto);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(ProductPatterns.RESERVE_STOCK)
  async reserveStock(data: {
    orderId: number;
    productId: number;
    quantity: number;
  }) {
    try {
      return await this.productsService.reserveStock(
        data.orderId,
        data.productId,
        data.quantity,
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @MessagePattern(ProductPatterns.RELEASE_STOCK)
  async releaseStock(data: {
    orderId: number;
    productId: number;
    quantity: number;
  }) {
    try {
      return await this.productsService.releaseStock(
        data.orderId,
        data.productId,
        data.quantity,
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }
}
