/**
 * Prisma seed script
 * Run: cd apps/api && npx prisma db seed
 *
 * Creates:
 *  - FinestPay UK as a test partner
 *  - Live + sandbox API keys
 *  - A webhook config
 *  - 10 sample payout records in various statuses
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt      from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean slate ──────────────────────────────────────────
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhookConfig.deleteMany();
  await prisma.recipient.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.partner.deleteMany();

  // ── Create FinestPay UK partner ──────────────────────────
  const partner = await prisma.partner.create({
    data: {
      id:      'partner_finestpay_001',
      name:    'FinestPay UK',
      email:   'tech@finestpay.co.uk',
      country: 'GB',
      status:  'ACTIVE',
    },
  });
  console.log(`✅ Partner created: ${partner.name} (${partner.id})`);

  // ── Generate API keys ─────────────────────────────────────
  const liveRawKey    = 'el_live_finestpay_test_key_do_not_use_in_production_abc123';
  const sandboxRawKey = 'el_test_finestpay_sandbox_key_do_not_use_in_production_xyz789';

  await prisma.apiKey.createMany({
    data: [
      {
        id:          'apikey_live_001',
        partnerId:   partner.id,
        label:       'Production Key',
        keyHash:     await bcrypt.hash(liveRawKey, 12),
        keyPreview:  `${liveRawKey.substring(0, 16)}...${liveRawKey.slice(-4)}`,
        environment: 'live',
      },
      {
        id:          'apikey_sandbox_001',
        partnerId:   partner.id,
        label:       'Sandbox Key',
        keyHash:     await bcrypt.hash(sandboxRawKey, 12),
        keyPreview:  `${sandboxRawKey.substring(0, 16)}...${sandboxRawKey.slice(-4)}`,
        environment: 'sandbox',
      },
    ],
  });
  console.log('✅ API keys created');
  console.log(`   Live key:    ${liveRawKey}`);
  console.log(`   Sandbox key: ${sandboxRawKey}`);

  // ── Register webhook ──────────────────────────────────────
  await prisma.webhookConfig.create({
    data: {
      partnerId: partner.id,
      url:       'https://api.finestpay.co.uk/webhooks/elorge',
      events:    ['payout.delivered', 'payout.failed', 'payout.processing'],
      isActive:  true,
      secret:    'webhook_secret_finestpay_test_do_not_use_in_production',
    },
  });
  console.log('✅ Webhook config created');

  // ── Seed sample payouts ───────────────────────────────────
  const samplePayouts = [
    {
      partnerReference: 'FP_TXN_001',
      sendAmount:       100,
      sendCurrency:     'GBP',
      nairaAmount:      204500.00,
      exchangeRate:     2050.45,
      fee:              2.99,
      status:           'DELIVERED' as const,
      narration:        'Family support',
      recipient: {
        fullName:      'Chukwuemeka Obi',
        bankCode:      '058',
        bankName:      'Guaranty Trust Bank',
        accountNumber: '0123456789',
        phone:         '+2348012345678',
      },
      deliveredAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1hr ago
    },
    {
      partnerReference: 'FP_TXN_002',
      sendAmount:       250,
      sendCurrency:     'GBP',
      nairaAmount:      506487.50,
      exchangeRate:     2050.45,
      fee:              3.99,
      status:           'DELIVERED' as const,
      narration:        'Business payment',
      recipient: {
        fullName:      'Adaeze Nwosu',
        bankCode:      '044',
        bankName:      'Access Bank',
        accountNumber: '0987654321',
        phone:         '+2348098765432',
      },
      deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      partnerReference: 'FP_TXN_003',
      sendAmount:       50,
      sendCurrency:     'GBP',
      nairaAmount:      101022.50,
      exchangeRate:     2050.45,
      fee:              1.99,
      status:           'PROCESSING' as const,
      narration:        'School fees',
      recipient: {
        fullName:      'Babatunde Adeleke',
        bankCode:      '057',
        bankName:      'Zenith Bank',
        accountNumber: '1122334455',
      },
      deliveredAt: null,
    },
    {
      partnerReference: 'FP_TXN_004',
      sendAmount:       500,
      sendCurrency:     'GBP',
      nairaAmount:      1022727.50,
      exchangeRate:     2050.45,
      fee:              4.99,
      status:           'FAILED' as const,
      narration:        'Rent payment',
      recipient: {
        fullName:      'Folake Adesanya',
        bankCode:      '011',
        bankName:      'First Bank of Nigeria',
        accountNumber: '2233445566',
      },
      deliveredAt: null,
    },
    {
      partnerReference: 'FP_TXN_005',
      sendAmount:       75,
      sendCurrency:     'GBP',
      nairaAmount:      151783.50,
      exchangeRate:     2050.45,
      fee:              1.99,
      status:           'PENDING' as const,
      narration:        'Monthly allowance',
      recipient: {
        fullName:      'Emeka Okonkwo',
        bankCode:      '033',
        bankName:      'United Bank for Africa',
        accountNumber: '3344556677',
      },
      deliveredAt: null,
    },
    {
      partnerReference: 'FP_TXN_006',
      sendAmount:       200,
      sendCurrency:     'GBP',
      nairaAmount:      405191.00,
      exchangeRate:     2050.45,
      fee:              2.99,
      status:           'DELIVERED' as const,
      narration:        'Medical expenses',
      recipient: {
        fullName:      'Ngozi Eze',
        bankCode:      '070',
        bankName:      'Fidelity Bank',
        accountNumber: '4455667788',
      },
      deliveredAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      partnerReference: 'FP_TXN_007',
      sendAmount:       150,
      sendCurrency:     'GBP',
      nairaAmount:      303916.50,
      exchangeRate:     2050.45,
      fee:              2.99,
      status:           'DELIVERED' as const,
      narration:        'Birthday gift',
      recipient: {
        fullName:      'Tunde Bakare',
        bankCode:      '100004',
        bankName:      'OPay',
        accountNumber: '5566778899',
      },
      deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      partnerReference: 'FP_TXN_008',
      sendAmount:       1000,
      sendCurrency:     'GBP',
      nairaAmount:      2045450.00,
      exchangeRate:     2050.45,
      fee:              4.99,
      status:           'FLAGGED' as const,
      narration:        'Property purchase',
      recipient: {
        fullName:      'Ibrahim Musa',
        bankCode:      '057',
        bankName:      'Zenith Bank',
        accountNumber: '6677889900',
      },
      deliveredAt: null,
    },
    {
      partnerReference: 'FP_TXN_009',
      sendAmount:       300,
      sendCurrency:     'USD',
      nairaAmount:      450000.00,
      exchangeRate:     1500.00,
      fee:              3.99,
      status:           'DELIVERED' as const,
      narration:        'Investment funds',
      recipient: {
        fullName:      'Chinwe Okafor',
        bankCode:      '044',
        bankName:      'Access Bank',
        accountNumber: '7788990011',
      },
      deliveredAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    },
    {
      partnerReference: 'FP_TXN_010',
      sendAmount:       80,
      sendCurrency:     'GBP',
      nairaAmount:      162236.00,
      exchangeRate:     2050.45,
      fee:              1.99,
      status:           'DELIVERED' as const,
      narration:        'Groceries',
      recipient: {
        fullName:      'Yewande Alade',
        bankCode:      '999992',
        bankName:      'Moniepoint',
        accountNumber: '8899001122',
      },
      deliveredAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ];

  for (const p of samplePayouts) {
    const payout = await prisma.payout.create({
      data: {
        partnerId:        partner.id,
        partnerReference: p.partnerReference,
        sendAmount:       p.sendAmount,
        sendCurrency:     p.sendCurrency,
        nairaAmount:      p.nairaAmount,
        exchangeRate:     p.exchangeRate,
        fee:              p.fee,
        status:           p.status,
        narration:        p.narration,
        deliveredAt:      p.deliveredAt,
        pspReference:     p.status === 'DELIVERED' ? `BANKLY_${uuidv4().substring(0, 8).toUpperCase()}` : undefined,
        recipient: {
          create: {
            fullName:      p.recipient.fullName,
            bankCode:      p.recipient.bankCode,
            bankName:      p.recipient.bankName,
            accountNumber: p.recipient.accountNumber,
            phone:         p.recipient.phone ?? null,
          },
        },
      },
    });
    console.log(`   💸 ${payout.partnerReference} [${payout.status}] → ${p.recipient.fullName}`);
  }

  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test with these API keys:');
  console.log(`  Live:    Bearer ${liveRawKey}`);
  console.log(`  Sandbox: Bearer ${sandboxRawKey}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
