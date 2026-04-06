// apps/api/src/modules/payouts/payouts.service.spec.ts
/**
 * Unit tests for PayoutsService — Transparent Fee Model
 * Run: cd apps/api && npm run test
 */

import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { getQueueToken }       from '@nestjs/bull';
import { ConfigService }       from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PayoutStatus, Currency } from '@elorge/constants';

import { ComplianceService } from '../compliance/compliance.service';
import { FxService }         from '../fx/fx.service';
import { PspFactory }        from '../psp/psp.factory';
import { PrismaService }     from '../../database/prisma.service';
import { PAYOUT_QUEUE }      from '../../queues/payout.queue';
import { PayoutsRepository } from './payouts.repository';
import { PayoutsService }    from './payouts.service';
import { CreatePayoutDto }   from './payouts.dto';

// ── Mocks ─────────────────────────────────────────────────────

const mockRepo = {
  create:          jest.fn(),
  findById:        jest.fn(),
  findByReference: jest.fn(),
  updateStatus:    jest.fn(),
  findMany:        jest.fn(),
  getStats:        jest.fn(),
};

const mockCompliance = {
  screenRecipient: jest.fn(),
};

const mockPspAdapter = {
  transfer:        jest.fn(),
  checkStatus:     jest.fn(),
  getBalance:      jest.fn(),
  validateAccount: jest.fn(),
};

const mockPspFactory = {
  getAdapter: jest.fn(() => mockPspAdapter),
};

const mockQueue = {
  add: jest.fn(),
};

// FxService: calculateFee is called by the service; mock it to return a fixed fee.
const mockFxService = {
  calculateFee: jest.fn(() => 2.99), // default: tier-2 fee for £100
  getRate:      jest.fn(),
  buildQuote:   jest.fn(),
  convertToNaira: jest.fn(),
};

// ConfigService: minPartnerBalanceGbp defaults to 0 in tests.
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'app.minPartnerBalanceGbp') return 0;
    return undefined;
  }),
};

// PrismaService: stubs for partner lookup and $transaction.
const mockPrismaService = {
  partner: {
    findUnique: jest.fn(),
    update:     jest.fn(),
  },
  balanceTransaction: {
    create: jest.fn(),
  },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

// ── Test Data ─────────────────────────────────────────────────

const PARTNER_ID = 'partner_test_001';

const validDto: CreatePayoutDto = {
  partnerReference: 'FP_TXN_TEST_001',
  sendAmount:       100,
  sendCurrency:     Currency.GBP,
  nairaAmount:      205000,
  exchangeRate:     2050,
  recipient: {
    fullName:      'Test Recipient',
    bankCode:      '058',            // GTBank — valid
    accountNumber: '0123456789',
  },
  sender: {
    fullName: 'Test Sender',
    country:  'GB',
  },
  narration: 'Test payout',
};

const mockPayoutRecord = {
  id:               'payout_abc123',
  partnerId:        PARTNER_ID,
  partnerReference: 'FP_TXN_TEST_001',
  sendAmount:       100,
  sendCurrency:     'GBP',
  nairaAmount:      205000,
  exchangeRate:     2050,
  fee:              2.99,   // stored as Decimal in DB; Number() is used in service
  status:           'PENDING',
  narration:        'Test payout',
  createdAt:        new Date(),
  updatedAt:        new Date(),
  deliveredAt:      null,
  pspReference:     null,
  failureReason:    null,
  bankSessionId:    null,
  recipient: {
    fullName:      'Test Recipient',
    bankCode:      '058',
    bankName:      'Guaranty Trust Bank',
    accountNumber: '0123456789',
    phone:         null,
  },
};

// Partner with enough balance to cover the fee (fee = £2.99 → 299 pence)
const mockPartner = {
  balancePence: 10000, // £100.00
  status:       'ACTIVE',
};

// ── Tests ─────────────────────────────────────────────────────

describe('PayoutsService — Transparent Fee Model', () => {
  let service: PayoutsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        { provide: PayoutsRepository,           useValue: mockRepo },
        { provide: ComplianceService,           useValue: mockCompliance },
        { provide: FxService,                   useValue: mockFxService },
        { provide: PspFactory,                  useValue: mockPspFactory },
        { provide: PrismaService,               useValue: mockPrismaService },
        { provide: ConfigService,               useValue: mockConfigService },
        { provide: getQueueToken(PAYOUT_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<PayoutsService>(PayoutsService);

    // Happy-path defaults
    mockRepo.findByReference.mockResolvedValue(null);
    mockCompliance.screenRecipient.mockResolvedValue({ passed: true, flagged: false });
    mockRepo.create.mockResolvedValue(mockPayoutRecord);
    mockRepo.updateStatus.mockResolvedValue(mockPayoutRecord);
    mockQueue.add.mockResolvedValue({ id: 'job_001' });
    mockPrismaService.partner.findUnique.mockResolvedValue(mockPartner);
    mockPrismaService.$transaction.mockResolvedValue([{}, {}]);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create() ────────────────────────────────────────────────
  describe('create()', () => {

    it('creates payout using partner-provided nairaAmount (no server-side FX)', async () => {
      const result = await service.create(PARTNER_ID, validDto);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nairaAmount:  205000,  // exact partner amount, no FX applied
          exchangeRate: 2050,    // informational, stored as-is
          fee:          2.99,    // Elorge platform fee
        }),
      );

      expect(mockQueue.add).toHaveBeenCalledWith(
        'dispatch',
        { payoutId: 'payout_abc123' },
        expect.objectContaining({ attempts: 5, jobId: 'payout_abc123' }),
      );

      expect(result).toMatchObject({
        payoutId:         'payout_abc123',
        partnerReference: 'FP_TXN_TEST_001',
        status:           'PENDING',
        nairaAmount:      205000,
        fee:              2.99,
      });
    });

    it('stores 0 for exchangeRate when partner does not declare it', async () => {
      const dto = { ...validDto, exchangeRate: undefined };
      mockRepo.create.mockResolvedValue({ ...mockPayoutRecord, exchangeRate: 0 });

      await service.create(PARTNER_ID, dto);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ exchangeRate: 0 }),
      );
    });

    it('throws BadRequestException for invalid bank code', async () => {
      const dto = { ...validDto, recipient: { ...validDto.recipient, bankCode: '999' } };
      await expect(service.create(PARTNER_ID, dto)).rejects.toThrow(BadRequestException);
      expect(mockCompliance.screenRecipient).not.toHaveBeenCalled();
    });

    it('throws ConflictException for duplicate partnerReference', async () => {
      mockRepo.findByReference.mockResolvedValue(mockPayoutRecord);
      await expect(service.create(PARTNER_ID, validDto)).rejects.toThrow(ConflictException);
    });

    it('throws 402 HttpException when partner balance is insufficient', async () => {
      // fee = 2.99 → 299 pence; partner only has 100 pence
      mockPrismaService.partner.findUnique.mockResolvedValue({
        balancePence: 100,
        status:       'ACTIVE',
      });

      await expect(service.create(PARTNER_ID, validDto)).rejects.toThrow(HttpException);

      try {
        await service.create(PARTNER_ID, validDto);
      } catch (err) {
        expect((err as HttpException).getStatus()).toBe(402);
        expect((err as HttpException).getResponse()).toMatchObject({
          code: 'INSUFFICIENT_BALANCE',
        });
      }
    });

    it('flags payout and does NOT queue when sanctions match', async () => {
      mockCompliance.screenRecipient.mockResolvedValue({
        passed:       false,
        flagged:      true,
        matchDetails: 'Sanctions list match: Bad Actor (score: 0.92)',
      });

      await service.create(PARTNER_ID, validDto);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'payout_abc123',
        PayoutStatus.FLAGGED,
        expect.objectContaining({ failureReason: 'Sanctions list match: Bad Actor (score: 0.92)' }),
      );
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('runs compliance screening before creating the payout record', async () => {
      const callOrder: string[] = [];
      mockCompliance.screenRecipient.mockImplementation(() => {
        callOrder.push('compliance');
        return Promise.resolve({ passed: true, flagged: false });
      });
      mockRepo.create.mockImplementation(() => {
        callOrder.push('repo.create');
        return Promise.resolve(mockPayoutRecord);
      });

      await service.create(PARTNER_ID, validDto);

      expect(callOrder.indexOf('compliance')).toBeLessThan(callOrder.indexOf('repo.create'));
    });

    it('debits partner balance after successful payout creation', async () => {
      await service.create(PARTNER_ID, validDto);

      // $transaction is called with the debit + ledger entry
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

  });

  // ── dispatch() ──────────────────────────────────────────────
  describe('dispatch()', () => {

    it('delivers exact nairaAmount via PSP', async () => {
      mockRepo.findById.mockResolvedValue(mockPayoutRecord);
      mockPspAdapter.transfer.mockResolvedValue({
        success:      true,
        pspReference: 'FLW_REF_001',
        status:       'successful',
        bankSession:  'NIP_SESSION_001',
      });

      await service.dispatch('payout_abc123');

      expect(mockPspAdapter.transfer).toHaveBeenCalledWith(
        expect.objectContaining({
          reference:     'payout_abc123',
          amount:        205000,         // partner's exact NGN amount
          bankCode:      '058',
          accountNumber: '0123456789',
        }),
      );

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'payout_abc123',
        PayoutStatus.DELIVERED,
        expect.objectContaining({ pspReference: 'FLW_REF_001' }),
      );
    });

    it('marks FAILED and throws when PSP returns failure', async () => {
      mockRepo.findById.mockResolvedValue(mockPayoutRecord);
      mockPspAdapter.transfer.mockResolvedValue({
        success:      false,
        pspReference: 'FLW_REF_002',
        status:       'failed',
        message:      'Account not found',
      });

      await expect(service.dispatch('payout_abc123')).rejects.toThrow('Transfer failed');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'payout_abc123',
        PayoutStatus.FAILED,
        expect.objectContaining({ failureReason: 'Account not found' }),
      );
    });

    it('refunds fee to partner on PSP failure', async () => {
      mockRepo.findById.mockResolvedValue(mockPayoutRecord); // fee: 2.99 → 299 pence
      mockPspAdapter.transfer.mockResolvedValue({
        success: false, status: 'failed', message: 'Bank unreachable',
      });

      try { await service.dispatch('payout_abc123'); } catch { /* expected */ }

      // $transaction called to issue the REFUND ledger entry
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('skips if payout not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await service.dispatch('nonexistent');
      expect(mockPspAdapter.transfer).not.toHaveBeenCalled();
    });

    it('skips if payout already DELIVERED', async () => {
      mockRepo.findById.mockResolvedValue({ ...mockPayoutRecord, status: 'DELIVERED' });
      await service.dispatch('payout_abc123');
      expect(mockPspAdapter.transfer).not.toHaveBeenCalled();
      expect(mockRepo.updateStatus).not.toHaveBeenCalled();
    });

  });

  // ── getStatus() ─────────────────────────────────────────────
  describe('getStatus()', () => {

    it('returns nairaAmount exactly as stored', async () => {
      mockRepo.findById.mockResolvedValue(mockPayoutRecord);
      const result = await service.getStatus('payout_abc123', PARTNER_ID);
      expect(result.nairaAmount).toBe(205000);
    });

    it('throws NotFoundException for unknown payout', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.getStatus('bad_id', PARTNER_ID)).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException for a different partner's payout", async () => {
      mockRepo.findById.mockResolvedValue({ ...mockPayoutRecord, partnerId: 'other_partner' });
      await expect(service.getStatus('payout_abc123', PARTNER_ID)).rejects.toThrow(NotFoundException);
    });

  });

  // ── list() ──────────────────────────────────────────────────
  describe('list()', () => {

    it('returns paginated payouts with correct field mapping', async () => {
      mockRepo.findMany.mockResolvedValue({ data: [mockPayoutRecord], total: 1 });

      const result = await service.list(PARTNER_ID, { page: 1, pageSize: 20 });

      expect(result.total).toBe(1);
      expect(result.data[0]).toMatchObject({
        nairaAmount: 205000,  // partner's amount preserved
        fee:         2.99,    // Elorge platform fee
      });
    });

  });

});