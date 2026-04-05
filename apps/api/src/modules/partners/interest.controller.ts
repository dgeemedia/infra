// apps/api/src/modules/partners/interest.controller.ts
import {
  Body, Controller, HttpCode, HttpStatus, Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsEmail, IsString, IsUrl, Length, IsOptional,
} from 'class-validator';

import { Public }           from '../../common/decorators/public.decorator';
import { PrismaService }    from '../../database/prisma.service';

class ExpressionOfInterestDto {
  @IsString() @Length(2, 100) companyName!:  string;
  @IsEmail()                  email!:        string;
  @IsString() @Length(2, 2)   country!:      string;

  @IsOptional()
  @IsString() @Length(0, 500) message?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  estimatedVolume?: string; // e.g. "£10k–£50k/month"
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
    summary: 'Submit expression of interest',
    description: 'Public endpoint — prospective partners submit their details. Admin is notified via a SYSTEM notification.',
  })
  async submit(@Body() dto: ExpressionOfInterestDto) {
    // Store as a SYSTEM notification for admin review
    // Find the admin account to attach the notification to
    const admin = await this.prisma.partner.findFirst({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'asc' },
    });

    if (admin) {
      await this.prisma.notification.create({
        data: {
          partnerId: admin.id,
          type:      'SYSTEM',
          title:     `New Partner Interest: ${dto.companyName}`,
          body:      `${dto.companyName} (${dto.email}, ${dto.country}) has expressed interest in joining Elorge.${dto.estimatedVolume ? ` Estimated volume: ${dto.estimatedVolume}.` : ''}${dto.message ? ` Message: "${dto.message}"` : ''}`,
          read:      false,
          metadata:  {
            companyName:     dto.companyName,
            email:           dto.email,
            country:         dto.country,
            website:         dto.website,
            estimatedVolume: dto.estimatedVolume,
            message:         dto.message,
            submittedAt:     new Date().toISOString(),
          },
        },
      });
    }

    // Return success regardless — don't leak whether admin exists
    return {
      success: true,
      message: 'Thank you for your interest. Our team will be in touch within 2 business days.',
    };
  }
}