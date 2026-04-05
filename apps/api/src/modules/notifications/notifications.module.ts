// apps/api/src/modules/notifications/notifications.module.ts
import { Module }                  from '@nestjs/common';
import { PrismaModule }            from '../../database/prisma.module';
import { NotificationsService }    from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports:     [PrismaModule],   // ← makes PrismaService injectable here
  providers:   [NotificationsService],
  controllers: [NotificationsController],
  exports:     [NotificationsService],
})
export class NotificationsModule {}