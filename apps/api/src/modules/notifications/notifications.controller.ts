// apps/api/src/modules/notifications/notifications.controller.ts
import {
  Controller, Get, Patch, Param, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedPartner } from '@elorge/types';
import { CurrentPartner }         from '../../common/decorators/current-partner.decorator';
import { NotificationsService }   from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /v1/notifications
  @Get()
  @ApiOperation({ summary: 'List notifications for the authenticated partner' })
  async list(@CurrentPartner() partner: AuthenticatedPartner) {
    return this.notificationsService.list(partner.id);
  }

  // PATCH /v1/notifications/read-all
  // ⚠️  MUST be declared before /:id/read — otherwise NestJS matches
  //     the literal string "read-all" as the :id param and this handler
  //     is never reached.
  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@CurrentPartner() partner: AuthenticatedPartner) {
    return this.notificationsService.markAllRead(partner.id);
  }

  // PATCH /v1/notifications/:id/read
  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markRead(
    @CurrentPartner() partner: AuthenticatedPartner,
    @Param('id')      id:      string,
  ) {
    return this.notificationsService.markRead(partner.id, id);
  }
}