import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const createTypeOrmConfig =
  (databaseEnvKey: string) =>
  (configService: ConfigService): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: configService.getOrThrow<string>('DB_HOST'),
    port: Number(configService.getOrThrow<string>('DB_PORT')),
    username: configService.getOrThrow<string>('DB_USERNAME'),
    password: configService.getOrThrow<string>('DB_PASSWORD'),
    database: configService.getOrThrow<string>(databaseEnvKey),
    autoLoadEntities: true,
    synchronize: false,
    ssl: false,
    retryAttempts: 5,
    retryDelay: 3000,
    extra: {
      connectionTimeoutMillis: 10_000,
    },
  });
