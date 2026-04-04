// apps/api/src/database/seeds/seed.ts
/**
 * Prisma seed script
 * Run: cd apps/api && npx prisma db seed
 *
 * Creates:
 *  - Elorge admin account
 *  - FinestPay UK as a test partner (with dashboard login)
 *  - Live + sandbox API keys
 *  - A webhook config
 *  - 10 sample payout records in various statuses
 *  - Sample notifications
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt      from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean slate (order matters — FK constraints) ─────────
  await prisma.notification.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhookConfig.deleteMany();
  await prisma.recipient.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.partner.deleteMany();

  // ── Admin password ────────────────────────────────────────
  // Dashboard login: admin@elorge.com / Admin1234!
  const adminPasswordHash = await bcrypt.hash('Admin1234!', 12);

  const admin = await prisma.partner.create({
    data: {
      id:           'partner_elorge_admin_001',
      name:         'Elorge Admin',
      email:        'admin@elorge.com',
      passwordHash: adminPasswordHash,
      role:         'ADMIN',
      country:      'GB',
      status:       'ACTIVE',
    },
  });
  console.log(`✅ Admin created: ${admin.name} (${admin.email})`);
  console.log(`   Password: Admin1234!`);

  // ── Partner password ──────────────────────────────────────
  // Dashboard login: tech@finestpay.co.uk / Partner1234!
  const partnerPasswordHash = await bcrypt.hash('Partner1234!', 12);

  const partner = await prisma.partner.create({
    data: {
      id:           'partner_finestpay_001',
      name:         'FinestPay UK',
      email:        'tech@finestpay.co.uk',
      passwordHash: partnerPasswordHash,
      role:         'PARTNER',
      country:      'GB',
      status:       'ACTIVE',
    },
  });
  console.log(`✅ Partner created: ${partner.name} (${partner.email})`);
  console.log(`   Password: Partner1234!`);

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
      deliveredAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
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
        phone:         null,
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
        phone:         null,
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
        phone:         null,
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
        phone:         null,
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
        phone:         null,
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
        phone:         null,
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
        phone:         null,
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
        phone:         null,
      },
      deliveredAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  ];

  console.log('\n💸 Creating payouts...');
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
        pspReference:     p.status === 'DELIVERED'
          ? `BANKLY_${uuidv4().substring(0, 8).toUpperCase()}`
          : undefined,
        failureReason:    p.status === 'FAILED'
          ? 'Recipient account number invalid'
          : undefined,
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
    console.log(`   ${payout.partnerReference} [${payout.status}] → ${p.recipient.fullName}`);
  }

  // ── Seed sample notifications ─────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        partnerId: partner.id,
        type:      'PAYOUT_DELIVERED',
        title:     'Payout Delivered',
        body:      'FP_TXN_001 was successfully credited to Chukwuemeka Obi.',
        read:      false,
        metadata:  { partnerReference: 'FP_TXN_001' },
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        partnerId: partner.id,
        type:      'PAYOUT_FAILED',
        title:     'Payout Failed',
        body:      'FP_TXN_004 failed after all retries. Recipient account number invalid.',
        read:      false,
        metadata:  { partnerReference: 'FP_TXN_004' },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        partnerId: partner.id,
        type:      'PAYOUT_FLAGGED',
        title:     'Payout Flagged',
        body:      'FP_TXN_008 is on hold pending compliance review.',
        read:      false,
        metadata:  { partnerReference: 'FP_TXN_008' },
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        partnerId: partner.id,
        type:      'PAYOUT_DELIVERED',
        title:     'Payout Delivered',
        body:      'FP_TXN_002 was successfully credited to Adaeze Nwosu.',
        read:      true,
        metadata:  { partnerReference: 'FP_TXN_002' },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        partnerId: partner.id,
        type:      'WEBHOOK_FAILED',
        title:     'Webhook Delivery Failed',
        body:      'Failed to deliver payout.delivered to https://api.finestpay.co.uk/webhooks/elorge. A retry is scheduled in 5 minutes.',
        read:      true,
        metadata:  { partnerReference: 'FP_TXN_006' },
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    ],
  });
  console.log('\n✅ Notifications seeded');

  // ── Summary ───────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Dashboard logins:');
  console.log('  Admin:   admin@elorge.com     / Admin1234!');
  console.log('  Partner: tech@finestpay.co.uk / Partner1234!');
  console.log('\nAPI keys (for direct API testing):');
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