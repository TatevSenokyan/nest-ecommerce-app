import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NotificationsController } from './notifications.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
