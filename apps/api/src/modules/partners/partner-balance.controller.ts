// apps/api/src/modules/partners/partner-balance.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentPartner } from '../../common/decorators/current-partner.decorator';
import { PrismaService }  from '../../database/prisma.service';
import type { AuthenticatedPartner } from '@elorge/types';

@ApiTags('Partners')
@ApiBearerAuth()
@Controller('v1/me/balance')
export class PartnerBalanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get own Naira balance and recent ledger' })
  async getMyBalance(@CurrentPartner() partner: AuthenticatedPartner) {
    const [record, recentLedger] = await Promise.all([
      this.prisma.partner.findUnique({
        where:  { id: partner.id },
        select: { balanceKobo: true, country: true },
      }),
      this.prisma.balanceTransaction.findMany({
        where:   { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
        take:    10,
        select: {
          id:               true,
          type:             true,
          amountKobo:       true,
          balanceAfterKobo: true,
          description:      true,
          createdAt:        true,
        },
      }),
    ]);

    if (!record) throw new Error('Partner not found');

    return {
      balanceKobo:   record.balanceKobo,
      balanceNaira:  (record.balanceKobo / 100).toFixed(2),
      country:       record.country,
      recentLedger:  recentLedger.map((e) => ({
        ...e,
        amountNaira:      (e.amountKobo / 100).toFixed(2),
        balanceAfterNaira:(e.balanceAfterKobo / 100).toFixed(2),
        createdAt:        e.createdAt.toISOString(),
      })),
    };
  }
}