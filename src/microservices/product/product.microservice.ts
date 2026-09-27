import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { ProductMicroserviceModule } from './product-microservice.module';
import { getRedisTransportOptions } from '../../common/microservice/redis-transport';

async function bootstrap() {
  const app = await NestFactory.create(ProductMicroserviceModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice(getRedisTransportOptions(configService));
  app.enableShutdownHooks();

  await app.init();
  await app.startAllMicroservices();
}

bootstrap();
