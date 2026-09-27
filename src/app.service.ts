import { Inject, Injectable } from '@nestjs/common';
import {
  APP_CONFIG,
} from './common/constants/app.constants';
import type { AppConfig } from './common/constants/providers/app-config.provider';

@Injectable()
export class AppService {
  constructor(
    @Inject(APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {}
  getHello(): string {
    return 'Hello!';
  }
  getConfig() {
    return this.appConfig;
  }
}
