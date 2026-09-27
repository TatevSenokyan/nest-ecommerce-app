import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const createDataSource = (
  databaseEnvKey: string,
  entities: DataSourceOptions['entities'],
  migrations: string[],
): DataSource =>
  new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5433),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env[databaseEnvKey],
    ssl: false,
    extra: {
      connectionTimeoutMillis: 10_000,
    },
    entities,
    migrations,
  });
