// apps/api/src/modules/partners/interest.controller.ts
import {
  Body, Controller, HttpCode, HttpStatus, Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsEmail, IsString, IsUrl, Length, IsOptional,
} from 'class-validator';

import { Public }        from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

class ExpressionOfInterestDto {
  @IsString() @Length(2, 100)
  companyName!: string;

  @IsEmail()
  email!: string;

  @IsString() @Length(2, 2)
  country!: string;

  @IsOptional()
  @IsString() @Length(0, 500)
  message?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  // Monthly NGN payout volume — e.g. "₦10m – ₦50m/month"
  // Stored as a free string so no schema change is needed.
  @IsOptional()
  @IsString()
  estimatedMonthlyVolume?: string;

  // Brief description of use case — remittance, payroll, marketplace, etc.
  @IsOptional()
  @IsString() @Length(0, 200)
  useCase?: string;
}

@ApiTags('Public')
@Controller('v1/interest')
export class InterestController {
  constructor(private readonly prisma: PrismaService) {}

  // POST /v1/interest — completely public, no auth
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:     'Submit expression of interest',
    description:
      'Public endpoint — prospective partners submit their details. ' +
      'Admin is notified via a SYSTEM notification in the inbox.',
  })
  async submit(@Body() dto: ExpressionOfInterestDto) {
    const admin = await this.prisma.partner.findFirst({
      where:   { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });

    if (admin) {
      const volumeNote = dto.estimatedMonthlyVolume
        ? ` Estimated monthly volume: ${dto.estimatedMonthlyVolume}.`
        : '';
      const useCaseNote = dto.useCase
        ? ` Use case: ${dto.useCase}.`
        : '';
      const messageNote = dto.message
        ? ` Message: "${dto.message}"`
        : '';

      await this.prisma.notification.create({
        data: {
          partnerId: admin.id,
          type:      'SYSTEM',
          title:     `New Partner Interest: ${dto.companyName}`,
          body:
            `${dto.companyName} (${dto.email}, ${dto.country}) has expressed interest ` +
            `in joining Elorge.${volumeNote}${useCaseNote}${messageNote}`,
          read:     false,
          metadata: {
            companyName:            dto.companyName,
            email:                  dto.email,
            country:                dto.country,
            website:                dto.website ?? null,
            estimatedMonthlyVolume: dto.estimatedMonthlyVolume ?? null,
            useCase:                dto.useCase ?? null,
            message:                dto.message ?? null,
            submittedAt:            new Date().toISOString(),
          },
        },
      });
    }

    return {
      success: true,
      message: 'Thank you for your interest. Our team will be in touch within 2 business days.',
    };
  }
}