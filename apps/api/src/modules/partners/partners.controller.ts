// apps/api/src/modules/partners/partners.controller.ts
import {
  Body, Controller, Get, Param, Patch, Post, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsEmail, IsIn, IsString, Length, MinLength, IsOptional,
} from 'class-validator';

import { Public }            from '../../common/decorators/public.decorator';
import { CurrentPartner }    from '../../common/decorators/current-partner.decorator';
import { PartnersService }   from './partners.service';
import type { AuthenticatedPartner } from '@elorge/types';

// ── DTOs ──────────────────────────────────────────────────────

class CreatePartnerDto {
  @IsString() @Length(2, 100) name!:    string;
  @IsEmail()                  email!:   string;
  @IsString() @Length(2, 2)   country!: string;

  // Optional — if absent the service auto-generates a secure temp password
  @IsOptional()
  @IsString() @MinLength(8)
  password?: string;
}

class GenerateKeyDto {
  @IsString() @Length(2, 50) label!:       string;
  @IsIn(['live', 'sandbox'])  environment!: 'live' | 'sandbox';
}

class ChangePasswordDto {
  @IsString() @MinLength(1)  currentPassword!: string;
  @IsString() @MinLength(8)  newPassword!:     string;
}

// ── Controller ────────────────────────────────────────────────

@ApiTags('Partners')
@Controller('v1/partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new partner (admin)' })
  async create(@Body() dto: CreatePartnerDto) {
    return this.partnersService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all partners' })
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
  async generateKey(@Param('id') id: string, @Body() dto: GenerateKeyDto) {
    return this.partnersService.generateApiKey(id, dto.label, dto.environment);
  }

  @Patch(':id/api-keys/:keyId/revoke')
  @Public()
  @ApiOperation({ summary: 'Revoke an API key' })
  async revokeKey(@Param('id') id: string, @Param('keyId') keyId: string) {
    return this.partnersService.revokeApiKey(keyId, id);
  }

  // ── Self-suspend ──────────────────────────────────────────
  @Patch('me/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Partner suspends their own account' })
  async selfSuspend(@CurrentPartner() partner: AuthenticatedPartner) {
    return this.partnersService.selfSuspend(partner.id);
  }

  // ── Change password ───────────────────────────────────────
  // Called by the partner to set their own password.
  // Verifies the current (temp) password first, then clears mustChangePassword.
  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Partner changes their own password' })
  async changePassword(
    @CurrentPartner() partner: AuthenticatedPartner,
    @Body()           dto:     ChangePasswordDto,
  ) {
    return this.partnersService.changePassword(
      partner.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}