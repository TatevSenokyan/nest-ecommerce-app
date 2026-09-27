import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { json } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';

function parseCorsOrigins(): string[] {
  return (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(helmet());
  app.use(json({ limit: '100kb' }));

  const corsOrigins = parseCorsOrigins();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS is required when NODE_ENV=production');
  }

  app.enableCors({
    origin: corsOrigins.length
      ? corsOrigins
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
