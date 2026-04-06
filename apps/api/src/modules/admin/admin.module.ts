// apps/api/src/modules/admin/admin.module.ts
import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { HttpModule }     from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule }    from '../../database/prisma.module';
import { AdminController } from './admin.controller';
import { AdminService }    from './admin.service';
import { AdminGuard }      from '../../common/guards/admin.guard';

@Module({
  imports: [
    PrismaModule,
    HttpModule,   // ← required for Flutterwave balance HTTP call
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
  // AdminService is used by PayoutsService indirectly via PrismaService,
  // so no need to export — all balance ops go through AdminController.
})
export class AdminModule {}