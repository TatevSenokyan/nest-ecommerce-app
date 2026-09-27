import { ConfigService } from '@nestjs/config';

export const getRedisConnection = (configService: ConfigService) => {
  const password = configService.get<string>('REDIS_PASSWORD');

  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: Number(configService.get<string>('REDIS_PORT', '6379')),
    ...(password ? { password } : {}),
  };
};
