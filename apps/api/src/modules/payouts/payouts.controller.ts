// apps/api/src/modules/payouts/payouts.controller.ts
import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, Post, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags,
} from '@nestjs/swagger';

import type { AuthenticatedPartner } from '@elorge/types';
import { ApiKeyGuard }    from '../../common/guards/api-key.guard';
import { CurrentPartner } from '../../common/decorators/current-partner.decorator';
import { CreatePayoutDto, PayoutQueryDto } from './payouts.dto';
import { PayoutsService } from './payouts.service';

@ApiTags('Payouts')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('v1/payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Initiate a payout' })
  @ApiResponse({ status: 201, description: 'Payout created and queued for delivery' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Duplicate partnerReference' })
  async create(
    @CurrentPartner() partner: AuthenticatedPartner,
    @Body()           dto:     CreatePayoutDto,
  ) {
    return this.payoutsService.create(partner.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List payouts' })
  async list(
    @CurrentPartner() partner: AuthenticatedPartner,
    @Query()          query:   PayoutQueryDto,
  ) {
    return this.payoutsService.list(partner.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payout status' })
  @ApiParam({ name: 'id', description: 'Elorge payout ID' })
  @ApiResponse({ status: 200, description: 'Payout details' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  async getStatus(
    @CurrentPartner() partner: AuthenticatedPartner,
    @Param('id')      id:      string,
  ) {
    return this.payoutsService.getStatus(id, partner.id);
  }
}