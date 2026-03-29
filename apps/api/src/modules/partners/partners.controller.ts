import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsIn, IsString, Length } from 'class-validator';

import { Public }           from '../../common/decorators/public.decorator';
import { PartnersService }  from './partners.service';

class CreatePartnerDto {
  @IsString() @Length(2, 100) name!:    string;
  @IsEmail()                  email!:   string;
  @IsString() @Length(2, 2)   country!: string;
}

class GenerateKeyDto {
  @IsString() @Length(2, 50)  label!:       string;
  @IsIn(['live', 'sandbox'])   environment!: 'live' | 'sandbox';
}

@ApiTags('Partners')
@Controller('v1/partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @Public()   // TODO: protect with admin JWT in production
  @ApiOperation({ summary: 'Create a new partner (admin)' })
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
  @ApiOperation({ summary: 'Get partner by ID (admin)' })
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
}
