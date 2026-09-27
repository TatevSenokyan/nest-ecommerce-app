import { Module } from '@nestjs/common';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
@Module({
  imports: [
    UsersModule,

    JwtModule.registerAsync({
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ): JwtModuleOptions => ({
        secret:
          configService.get<string>('JWT_SECRET'),

        signOptions: {
          expiresIn: configService.get<
            JwtSignOptions['expiresIn']
          >('JWT_EXPIRES_IN', '1h'),
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AuthService,
    JwtStrategy,
  ],
})
export class AuthModule {}
