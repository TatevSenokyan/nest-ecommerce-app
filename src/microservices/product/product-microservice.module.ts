import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsModule } from '../../products/products.module';
import { ProductMicroserviceController } from './product-microservice.controller';
import { createTypeOrmConfig } from '../../database/typeorm.config';
import { DB_DATABASE_PRODUCTS } from '../../common/constants/database.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmConfig(DB_DATABASE_PRODUCTS),
    }),
    ProductsModule,
  ],
  controllers: [ProductMicroserviceController],
})
export class ProductMicroserviceModule {}
