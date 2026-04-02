// apps/api/src/modules/admin/admin.module.ts
import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule }    from '../../database/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService }    from './admin.service';
import { AdminGuard }      from '../../common/guards/admin.guard';

@Module({
  imports: [
    // PrismaModule exposes PrismaService for AdminService
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
  controllers: [AdminController],
  providers:   [AdminService, AdminGuard],
})
export class AdminModule {}