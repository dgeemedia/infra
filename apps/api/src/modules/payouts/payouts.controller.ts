import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { Partner }             from '@elorge/types';
import { ApiKeyGuard }              from '../../common/guards/api-key.guard';
import { CurrentPartner }           from '../../common/decorators/current-partner.decorator';
import { CreatePayoutDto, PayoutQueryDto } from './payouts.dto';
import { PayoutsService }           from './payouts.service';

@ApiTags('Payouts')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('v1/payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  // ── POST /v1/payouts ──────────────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:     'Initiate a payout',
    description: 'Creates a new Naira payout to a Nigerian bank account. Returns immediately — delivery happens asynchronously. Listen to webhooks for status updates.',
  })
  @ApiResponse({ status: 201, description: 'Payout created and queued for delivery' })
  @ApiResponse({ status: 400, description: 'Validation error — invalid bank code, amount, etc.' })
  @ApiResponse({ status: 409, description: 'Duplicate partnerReference' })
  async create(
    @CurrentPartner() partner: Partner,
    @Body()           dto:     CreatePayoutDto,
  ) {
    return this.payoutsService.create(partner.id, dto);
  }

  // ── GET /v1/payouts ───────────────────────────────────────
  @Get()
  @ApiOperation({
    summary:     'List payouts',
    description: 'Returns a paginated list of all payouts for the authenticated partner. Supports filtering by status, date range, and search.',
  })
  async list(
    @CurrentPartner() partner: Partner,
    @Query()          query:   PayoutQueryDto,
  ) {
    return this.payoutsService.list(partner.id, query);
  }

  // ── GET /v1/payouts/:id ───────────────────────────────────
  @Get(':id')
  @ApiOperation({
    summary:     'Get payout status',
    description: 'Returns the current status and details of a specific payout.',
  })
  @ApiParam({ name: 'id', description: 'Elorge payout ID (ELG_PAY_...)' })
  @ApiResponse({ status: 200, description: 'Payout details' })
  @ApiResponse({ status: 404, description: 'Payout not found' })
  async getStatus(
    @CurrentPartner() partner: Partner,
    @Param('id')      id:      string,
  ) {
    return this.payoutsService.getStatus(id, partner.id);
  }
}
