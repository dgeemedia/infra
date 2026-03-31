// apps/api/src/modules/webhooks/webhooks.controller.ts
import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsEnum, IsUrl } from 'class-validator';

import type { AuthenticatedPartner, WebhookEventType } from '@elorge/types';
import { CurrentPartner } from '../../common/decorators/current-partner.decorator';
import { WebhooksService } from './webhooks.service';

class RegisterWebhookDto {
  @IsUrl({}, { message: 'url must be a valid HTTPS URL' })
  url!: string;

  @IsArray()
  @IsEnum(['payout.delivered', 'payout.failed', 'payout.processing', 'payout.flagged'], { each: true })
  events!: WebhookEventType[];
}

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a webhook URL' })
  async register(
    @CurrentPartner() partner: AuthenticatedPartner,
    @Body()           dto:     RegisterWebhookDto,
  ) {
    return this.webhooksService.register(partner.id, dto.url, dto.events);
  }

  @Get()
  @ApiOperation({ summary: 'List all registered webhooks' })
  async list(@CurrentPartner() partner: AuthenticatedPartner) {
    return this.webhooksService.list(partner.id);
  }
}