import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { ProductClientService } from '../microservices/product/product-client.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Public } from '../auth/decorators/public.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productClient: ProductClientService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productClient.create(createProductDto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productClient.update(id, updateProductDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.productClient.getAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productClient.getProduct(id);
  }
}
