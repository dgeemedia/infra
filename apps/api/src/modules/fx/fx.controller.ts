import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

import { Currency } from '@elorge/constants';
import type { RateResponse } from '@elorge/types';

import { FxService } from './fx.service';

class RateQueryDto {
  @IsEnum(Currency)
  from!: Currency;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount!: number;
}

@ApiTags('Rates')
@Controller('v1/rates')
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @Get()
  @ApiOperation({
    summary:     'Get live exchange rate and fee quote',
    description: 'Returns the current GBP→NGN (or other currency→NGN) exchange rate with fee and final recipient amount. Rate is valid for the duration shown in rateExpiresAt.',
  })
  @ApiQuery({ name: 'from',   enum: Currency, description: 'Sending currency (e.g. GBP)' })
  @ApiQuery({ name: 'amount', type: Number,   description: 'Amount to send (e.g. 100)' })
  async getRate(@Query() query: RateQueryDto): Promise<RateResponse> {
    const quote = await this.fxService.buildQuote(query.from, query.amount);
    return {
      quote,
      indicativeOnly: false,
    };
  }
}
