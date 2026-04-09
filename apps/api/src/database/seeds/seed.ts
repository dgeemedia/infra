/**
 * apps/api/src/database/seeds/seed.ts
 *
 * Prisma seed script — pure NGN model.
 * Partners fund a Naira wallet (kobo) and pay out directly in NGN.
 * No FX, no GBP/USD/EUR send amounts.
 *
 * Run: cd apps/api && npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt      from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// ── Fee tiers (must match payouts.service.ts) ─────────────────
function calculateFeeKobo(nairaAmountKobo: number): number {
  if (nairaAmountKobo <= 5_000_000)   return 15_000;  // ≤ ₦50,000   → ₦150
  if (nairaAmountKobo <= 20_000_000)  return 25_000;  // ≤ ₦200,000  → ₦250
  if (nairaAmountKobo <= 100_000_000) return 40_000;  // ≤ ₦1,000,000→ ₦400
  return 60_000;                                       // > ₦1,000,000→ ₦600
}

async function main() {
  console.log('🌱 Seeding database (pure NGN model)...');

  // ── Clean slate ───────────────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.webhookDelivery.deleteMany();
  await prisma.webhookConfig.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.recipient.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.partner.deleteMany();

  // ── Admin ─────────────────────────────────────────────────
  const admin = await prisma.partner.create({
    data: {
      id:           'partner_elorge_admin_001',
      name:         'Elorge Admin',
      email:        'admin@elorge.com',
      passwordHash: await bcrypt.hash('Admin1234!', 12),
      role:         'ADMIN',
      country:      'NG',
      status:       'ACTIVE',
    },
  });
  console.log(`✅ Admin: ${admin.email} / Admin1234!`);

  // ── Partner — prefunded with ₦2,000,000 ──────────────────
  // 200,000,000 kobo = ₦2,000,000
  const INITIAL_BALANCE_KOBO = 200_000_000;

  const partner = await prisma.partner.create({
    data: {
      id:                'partner_finestpay_001',
      name:              'FinestPay UK',
      email:             'tech@finestpay.co.uk',
      passwordHash:      await bcrypt.hash('Partner1234!', 12),
      role:              'PARTNER',
      country:           'GB',
      status:            'ACTIVE',
      balanceKobo:       INITIAL_BALANCE_KOBO,
    },
  });
  console.log(`✅ Partner: ${partner.email} / Partner1234!`);
  console.log(`   Wallet: ₦${(INITIAL_BALANCE_KOBO / 100).toLocaleString('en-NG')}`);

  // ── Initial wallet credit ledger entry ────────────────────
  await prisma.balanceTransaction.create({
    data: {
      partnerId:        partner.id,
      type:             'CREDIT',
      amountKobo:       INITIAL_BALANCE_KOBO,
      balanceAfterKobo: INITIAL_BALANCE_KOBO,
      description:      'Initial wallet funding — seed data',
    },
  });

  // ── API keys ──────────────────────────────────────────────
  const liveKey    = 'el_live_finestpay_test_key_do_not_use_in_production_abc123';
  const sandboxKey = 'el_test_finestpay_sandbox_key_do_not_use_in_production_xyz789';

  await prisma.apiKey.createMany({
    data: [
      {
        id:          'apikey_live_001',
        partnerId:   partner.id,
        label:       'Production Key',
        keyHash:     await bcrypt.hash(liveKey, 12),
        keyPreview:  `${liveKey.substring(0, 16)}...${liveKey.slice(-4)}`,
        environment: 'live',
      },
      {
        id:          'apikey_sandbox_001',
        partnerId:   partner.id,
        label:       'Sandbox Key',
        keyHash:     await bcrypt.hash(sandboxKey, 12),
        keyPreview:  `${sandboxKey.substring(0, 16)}...${sandboxKey.slice(-4)}`,
        environment: 'sandbox',
      },
    ],
  });
  console.log('✅ API keys created');

  // ── Webhook ───────────────────────────────────────────────
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

  // ── Sample payouts (all amounts in kobo) ─────────────────
  // nairaAmountKobo = NGN × 100
  const samplePayouts = [
    {
      partnerReference: 'FP_TXN_001',
      nairaAmountKobo:  20_450_000,   // ₦204,500
      status:           'DELIVERED' as const,
      narration:        'Family support',
      deliveredAt:      new Date(Date.now() - 1 * 3600 * 1000),
      recipient: { fullName: 'Chukwuemeka Obi',  bankCode: '058', bankName: 'Guaranty Trust Bank',     accountNumber: '0123456789', phone: '+2348012345678' },
    },
    {
      partnerReference: 'FP_TXN_002',
      nairaAmountKobo:  50_648_750,   // ₦506,487.50
      status:           'DELIVERED' as const,
      narration:        'Business payment',
      deliveredAt:      new Date(Date.now() - 2 * 3600 * 1000),
      recipient: { fullName: 'Adaeze Nwosu',      bankCode: '044', bankName: 'Access Bank',            accountNumber: '0987654321', phone: '+2348098765432' },
    },
    {
      partnerReference: 'FP_TXN_003',
      nairaAmountKobo:  10_102_250,   // ₦101,022.50
      status:           'PROCESSING' as const,
      narration:        'School fees',
      deliveredAt:      null,
      recipient: { fullName: 'Babatunde Adeleke', bankCode: '057', bankName: 'Zenith Bank',             accountNumber: '1122334455', phone: null },
    },
    {
      partnerReference: 'FP_TXN_004',
      nairaAmountKobo:  102_272_750,  // ₦1,022,727.50
      status:           'FAILED' as const,
      narration:        'Rent payment',
      deliveredAt:      null,
      recipient: { fullName: 'Folake Adesanya',   bankCode: '011', bankName: 'First Bank of Nigeria',  accountNumber: '2233445566', phone: null },
    },
    {
      partnerReference: 'FP_TXN_005',
      nairaAmountKobo:  15_178_350,   // ₦151,783.50
      status:           'PENDING' as const,
      narration:        'Monthly allowance',
      deliveredAt:      null,
      recipient: { fullName: 'Emeka Okonkwo',     bankCode: '033', bankName: 'United Bank for Africa', accountNumber: '3344556677', phone: null },
    },
    {
      partnerReference: 'FP_TXN_006',
      nairaAmountKobo:  40_519_100,   // ₦405,191
      status:           'DELIVERED' as const,
      narration:        'Medical expenses',
      deliveredAt:      new Date(Date.now() - 5 * 3600 * 1000),
      recipient: { fullName: 'Ngozi Eze',          bankCode: '070', bankName: 'Fidelity Bank',         accountNumber: '4455667788', phone: null },
    },
    {
      partnerReference: 'FP_TXN_007',
      nairaAmountKobo:  30_391_650,   // ₦303,916.50
      status:           'DELIVERED' as const,
      narration:        'Birthday gift',
      deliveredAt:      new Date(Date.now() - 24 * 3600 * 1000),
      recipient: { fullName: 'Tunde Bakare',       bankCode: '100004', bankName: 'OPay',               accountNumber: '5566778899', phone: null },
    },
    {
      partnerReference: 'FP_TXN_008',
      nairaAmountKobo:  204_545_000,  // ₦2,045,450
      status:           'FLAGGED' as const,
      narration:        'Property purchase',
      deliveredAt:      null,
      recipient: { fullName: 'Ibrahim Musa',       bankCode: '057', bankName: 'Zenith Bank',           accountNumber: '6677889900', phone: null },
    },
    {
      partnerReference: 'FP_TXN_009',
      nairaAmountKobo:  45_000_000,   // ₦450,000
      status:           'DELIVERED' as const,
      narration:        'Investment funds',
      deliveredAt:      new Date(Date.now() - 48 * 3600 * 1000),
      recipient: { fullName: 'Chinwe Okafor',      bankCode: '044', bankName: 'Access Bank',           accountNumber: '7788990011', phone: null },
    },
    {
      partnerReference: 'FP_TXN_010',
      nairaAmountKobo:  16_223_600,   // ₦162,236
      status:           'DELIVERED' as const,
      narration:        'Groceries',
      deliveredAt:      new Date(Date.now() - 3 * 3600 * 1000),
      recipient: { fullName: 'Yewande Alade',      bankCode: '999992', bankName: 'Moniepoint',         accountNumber: '8899001122', phone: null },
    },
  ] as const;

  console.log('\n💸 Creating payouts...');

  // Track running balance to build accurate ledger
  let runningBalanceKobo = INITIAL_BALANCE_KOBO;

  for (const p of samplePayouts) {
    const feeKobo        = calculateFeeKobo(p.nairaAmountKobo);
    const totalDebitKobo = p.nairaAmountKobo + feeKobo;

    const payout = await prisma.payout.create({
      data: {
        partnerId:        partner.id,
        partnerReference: p.partnerReference,
        nairaAmountKobo:  p.nairaAmountKobo,
        feeKobo,
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

    // Create ledger DEBIT for each payout
    runningBalanceKobo -= totalDebitKobo;

    await prisma.balanceTransaction.create({
      data: {
        partnerId:        partner.id,
        type:             'DEBIT',
        amountKobo:       totalDebitKobo,
        balanceAfterKobo: runningBalanceKobo,
        description:
          `Payout ${payout.id} — ` +
          `₦${(p.nairaAmountKobo / 100).toLocaleString('en-NG')} to ${p.recipient.fullName} ` +
          `+ ₦${(feeKobo / 100).toLocaleString('en-NG')} fee`,
        payoutId: payout.id,
      },
    });

    // Refund fee on FAILED payouts
    if (p.status === 'FAILED') {
      runningBalanceKobo += feeKobo;
      await prisma.balanceTransaction.create({
        data: {
          partnerId:        partner.id,
          type:             'REFUND',
          amountKobo:       feeKobo,
          balanceAfterKobo: runningBalanceKobo,
          description:      `Fee refund — payout ${payout.id} failed`,
          payoutId:         payout.id,
        },
      });
    }

    console.log(
      `   ${payout.partnerReference} [${payout.status}] ` +
      `₦${(p.nairaAmountKobo / 100).toLocaleString('en-NG')} → ${p.recipient.fullName}`,
    );
  }

  // Sync partner balance to actual running total
  await prisma.partner.update({
    where: { id: partner.id },
    data:  { balanceKobo: runningBalanceKobo },
  });
  console.log(`\n   Wallet after payouts: ₦${(runningBalanceKobo / 100).toLocaleString('en-NG')}`);

  // ── Notifications ─────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        partnerId: partner.id,
        type:      'PAYOUT_DELIVERED',
        title:     'Payout Delivered',
        body:      'FP_TXN_001 was successfully credited to Chukwuemeka Obi.',
        read:      false,
        metadata:  { partnerReference: 'FP_TXN_001' },
        createdAt: new Date(Date.now() - 1 * 3600 * 1000),
      },
      {
        partnerId: partner.id,
        type:      'PAYOUT_FAILED',
        title:     'Payout Failed',
        body:      'FP_TXN_004 failed after all retries. Recipient account number invalid.',
        read:      false,
        metadata:  { partnerReference: 'FP_TXN_004' },
        createdAt: new Date(Date.now() - 3 * 3600 * 1000),
      },
      {
        partnerId: partner.id,
        type:      'PAYOUT_FLAGGED',
        title:     'Payout Flagged',
        body:      'FP_TXN_008 is on hold pending compliance review.',
        read:      false,
        metadata:  { partnerReference: 'FP_TXN_008' },
        createdAt: new Date(Date.now() - 6 * 3600 * 1000),
      },
      {
        partnerId: partner.id,
        type:      'PAYOUT_DELIVERED',
        title:     'Payout Delivered',
        body:      'FP_TXN_002 was successfully credited to Adaeze Nwosu.',
        read:      true,
        metadata:  { partnerReference: 'FP_TXN_002' },
        createdAt: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        partnerId: partner.id,
        type:      'WEBHOOK_FAILED',
        title:     'Webhook Delivery Failed',
        body:      'Failed to deliver payout.delivered to https://api.finestpay.co.uk/webhooks/elorge.',
        read:      true,
        metadata:  { partnerReference: 'FP_TXN_006' },
        createdAt: new Date(Date.now() - 48 * 3600 * 1000),
      },
    ],
  });

  // ── Summary ───────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Dashboard logins:');
  console.log('  Admin:   admin@elorge.com     / Admin1234!');
  console.log('  Partner: tech@finestpay.co.uk / Partner1234!');
  console.log('\nAPI keys:');
  console.log(`  Live:    Bearer ${liveKey}`);
  console.log(`  Sandbox: Bearer ${sandboxKey}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => { void prisma.$disconnect(); });