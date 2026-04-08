// apps/api/src/modules/partners/partner-balance.controller.ts
//
// Partner-facing balance endpoint.
// Partners call this to see their wallet balance and — crucially —
// their VAN (Virtual Account Number) to fund it.

import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { CurrentPartner } from '../../common/decorators/current-partner.decorator';
import { PrismaService }  from '../../database/prisma.service';
import type { AuthenticatedPartner } from '@elorge/types';

@ApiTags('Partner — Wallet')
@ApiBearerAuth()
@Controller('v1/me/balance')
export class PartnerBalanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary:     'Get own Naira wallet balance, VAN funding details and ledger',
    description:
      'Returns the partner\'s current prepaid Naira balance, ' +
      'their dedicated Virtual Account Number to wire funds to, ' +
      'and the last 10 ledger entries.',
  })
  async getMyBalance(@CurrentPartner() partner: AuthenticatedPartner) {
    const [record, recentLedger] = await Promise.all([
      this.prisma.partner.findUnique({
        where:  { id: partner.id },
        select: {
          balanceKobo:         true,
          country:             true,
          // VAN funding details
          flwVanAccountNumber: true,
          flwVanBankName:      true,
          flwVanBankCode:      true,
          flwVanReference:     true,
          flwVanCreatedAt:     true,
        },
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
      // Wallet balance
      balanceKobo:  record.balanceKobo,
      balanceNaira: (record.balanceKobo / 100).toFixed(2),
      country:      record.country,

      // ── Funding instructions ───────────────────────────
      // This is what the partner dashboard shows to help
      // partners top up their wallet without any manual
      // intervention from Elorge.
      fundingAccount: record.flwVanAccountNumber
        ? {
            bankName:      record.flwVanBankName,
            bankCode:      record.flwVanBankCode,
            accountNumber: record.flwVanAccountNumber,
            accountName:   'Elorge Technologies Limited',
            reference:     record.flwVanReference,
            instructions:  [
              `Transfer any amount of NGN to the account above.`,
              `Your Elorge wallet will be credited automatically within 60 seconds.`,
              `Use your reference number "${record.flwVanReference}" as the transfer narration.`,
            ],
          }
        : null,  // null in dev/sandbox if VAN not yet provisioned

      // Ledger
      recentLedger: recentLedger.map((e) => ({
        id:                e.id,
        type:              e.type,
        amountKobo:        e.amountKobo,
        amountNaira:       (e.amountKobo / 100).toFixed(2),
        balanceAfterKobo:  e.balanceAfterKobo,
        balanceAfterNaira: (e.balanceAfterKobo / 100).toFixed(2),
        description:       e.description,
        createdAt:         e.createdAt.toISOString(),
      })),
    };
  }
}