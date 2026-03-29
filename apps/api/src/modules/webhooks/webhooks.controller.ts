import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsEnum, IsUrl } from 'class-validator';

import type { Partner, WebhookEventType } from '@elorge/types';

import { ApiKeyGuard }    from '../../common/guards/api-key.guard';
import { CurrentPartner } from '../../common/decorators/current-partner.decorator';
import { WebhooksService } from './webhooks.service';

const WEBHOOK_EVENTS = [
  'payout.delivered',
  'payout.failed',
  'payout.processing',
  'payout.flagged',
] as const;

class RegisterWebhookDto {
  @IsUrl({}, { message: 'url must be a valid HTTPS URL' })
  url!: string;

  @IsArray()
  @IsEnum(['payout.delivered', 'payout.failed', 'payout.processing', 'payout.flagged'], { each: true })
  events!: WebhookEventType[];
}

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:     'Register a webhook URL',
    description: 'Register an HTTPS endpoint to receive payout lifecycle events. Store the returned secret — it is used to verify webhook signatures.',
  })
  async register(
    @CurrentPartner() partner: Partner,
    @Body()           dto:     RegisterWebhookDto,
  ) {
    return this.webhooksService.register(partner.id, dto.url, dto.events);
  }

  @Get()
  @ApiOperation({ summary: 'List all registered webhooks' })
  async list(@CurrentPartner() partner: Partner) {
    return this.webhooksService.list(partner.id);
  }
}
