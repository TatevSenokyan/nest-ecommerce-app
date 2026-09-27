import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { AuthModule } from './auth/auth.module';
import { appConfigProvider } from './common/constants/providers/app-config.provider';
import { ProductsApiModule } from './products/products-api.module';
import { OrdersApiModule } from './orders/orders-api.module';
import { HealthModule } from './health/health.module';
import { PaymentsApiModule } from './payments/payments-api.module';
import { ThrottleModule } from './common/throttle/throttle.module';
import { createTypeOrmConfig } from './database/typeorm.config';
import { DB_DATABASE_API } from './common/constants/database.constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmConfig(DB_DATABASE_API),
    }),
    UsersModule,
    ProfileModule,
    AuthModule,
    ThrottleModule,
    ProductsApiModule,
    OrdersApiModule,
    PaymentsApiModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, appConfigProvider],
})
export class AppModule {}
