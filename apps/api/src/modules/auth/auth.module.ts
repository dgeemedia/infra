// apps/api/src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule }  from '../../database/prisma.module';
import { AuthService }   from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    // PrismaModule provides PrismaService for validateApiKey + validateJwtToken
    PrismaModule,
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.get<string>('app.jwtSecret'),
        signOptions: { expiresIn: config.get<string>('app.jwtExpiresIn') ?? '7d' },
      }),
    }),
  ],
  providers:   [AuthService],
  controllers: [AuthController],
  exports:     [AuthService, JwtModule],
})
export class AuthModule {}