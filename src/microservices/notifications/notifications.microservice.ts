import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { NotificationsModule } from './notifications.module';
import { getKafkaTransportOptions } from '../../common/microservice/kafka-transport';

async function bootstrap() {
  const app = await NestFactory.create(NotificationsModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice(
    getKafkaTransportOptions(
      configService,
      'notifications-microservice',
      'notifications-group',
    ),
  );
  app.enableShutdownHooks();

  await app.init();
  await app.startAllMicroservices();
}

bootstrap();
