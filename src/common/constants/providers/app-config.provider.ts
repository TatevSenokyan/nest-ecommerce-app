import { ConfigService } from '@nestjs/config';

import { APP_CONFIG } from '../app.constants';

export interface AppConfig {
  environment: string;
  port: number;
}

export const appConfigProvider = {
  provide: APP_CONFIG,

  useFactory: (configService: ConfigService): AppConfig => {
    return {
      environment:
        configService.get<string>(
          'NODE_ENV',
          'development',
        ),

      port: Number(
        configService.get<string>(
          'PORT',
          '3000',
        ),
      ),
    };
  },

  inject: [ConfigService],
};
