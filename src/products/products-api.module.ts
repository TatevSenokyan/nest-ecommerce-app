import { Module } from '@nestjs/common';

import { ProductsController } from './products.controller';
import { ProductClientModule } from '../microservices/product/product-client.module';

@Module({
  imports: [ProductClientModule],
  controllers: [ProductsController],
})
export class ProductsApiModule {}
