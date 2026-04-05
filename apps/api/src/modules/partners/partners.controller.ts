// apps/api/src/modules/partners/partners.controller.ts
import {
  Body, Controller, Get, Param, Patch, Post, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsEmail, IsEnum, IsIn, IsString, Length, MinLength,
} from 'class-validator';

import { Public }            from '../../common/decorators/public.decorator';
import { CurrentPartner }    from '../../common/decorators/current-partner.decorator';
import { PartnersService }   from './partners.service';
import type { AuthenticatedPartner } from '@elorge/types';

// ── DTOs ──────────────────────────────────────────────────────

class CreatePartnerDto {
  @IsString() @Length(2, 100) name!:     string;
  @IsEmail()                  email!:    string;
  @IsString() @Length(2, 2)   country!:  string;
  @IsString() @MinLength(8)   password!: string;  // ← set on creation now
}

class GenerateKeyDto {
  @IsString() @Length(2, 50) label!:       string;
  @IsIn(['live', 'sandbox'])  environment!: 'live' | 'sandbox';
}

// ── Controller ────────────────────────────────────────────────

@ApiTags('Partners')
@Controller('v1/partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  // ── Create partner (admin-only in production, guarded by AdminGuard at
  //    the admin module level — this one remains @Public for seeding/dev) ──
  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new partner' })
  async create(@Body() dto: CreatePartnerDto) {
    return this.partnersService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all partners (admin)' })
  async findAll() {
    return this.partnersService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get partner by ID' })
  async findOne(@Param('id') id: string) {
    return this.partnersService.findById(id);
  }

  @Get(':id/stats')
  @Public()
  @ApiOperation({ summary: 'Get partner payout stats' })
  async getStats(@Param('id') id: string) {
    return this.partnersService.getStats(id);
  }

  @Post(':id/api-keys')
  @Public()
  @ApiOperation({ summary: 'Generate a new API key for a partner' })
  async generateKey(
    @Param('id') id:  string,
    @Body()      dto: GenerateKeyDto,
  ) {
    return this.partnersService.generateApiKey(id, dto.label, dto.environment);
  }

  @Patch(':id/api-keys/:keyId/revoke')
  @Public()
  @ApiOperation({ summary: 'Revoke an API key' })
  async revokeKey(
    @Param('id')    id:    string,
    @Param('keyId') keyId: string,
  ) {
    return this.partnersService.revokeApiKey(keyId, id);
  }

  // ── Self-suspend (partner suspends their own account) ─────────
  //    Uses ApiKeyGuard (dashboard JWT) — NOT AdminGuard.
  //    Only the account owner can suspend themselves.
  //    Only an admin can reactivate — no self-reactivate endpoint exists.
  @Patch('me/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Partner suspends their own account' })
  async selfSuspend(@CurrentPartner() partner: AuthenticatedPartner) {
    return this.partnersService.selfSuspend(partner.id);
  }
}