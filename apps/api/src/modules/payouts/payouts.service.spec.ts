// apps/api/src/modules/payouts/payouts.service.spec.ts
/**
 * Unit tests for PayoutsService — Transparent Fee Model
 * Run: cd apps/api && npm run test
 */

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getQueueToken }       from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';

import { PayoutStatus, Currency } from '@elorge/constants';

import { ComplianceService } from '../compliance/compliance.service';
import { PspFactory }        from '../psp/psp.factory';
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

// ── Test Data ─────────────────────────────────────────────────
const PARTNER_ID = 'partner_test_001';

/**
 * Valid DTO — transparent fee model.
 * Partner provides nairaAmount directly.
 * No exchangeRate required (informational only).
 */
const validDto: CreatePayoutDto = {
  partnerReference: 'FP_TXN_TEST_001',
  sendAmount:       100,
  sendCurrency:     Currency.GBP,
  nairaAmount:      205000,          // ← partner calculated this themselves
  exchangeRate:     2050,            // ← informational only
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
  nairaAmount:      205000,   // exact partner-provided amount
  exchangeRate:     2050,     // informational
  fee:              0.35,     // Elorge platform fee in GBP
  status:           'PENDING',
  narration:        'Test payout',
  createdAt:        new Date(),
  updatedAt:        new Date(),
  recipient: {
    fullName:      'Test Recipient',
    bankCode:      '058',
    bankName:      'Guaranty Trust Bank',
    accountNumber: '0123456789',
    phone:         null,
  },
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
        { provide: PspFactory,                  useValue: mockPspFactory },
        { provide: getQueueToken(PAYOUT_QUEUE), useValue: mockQueue },
        // ✅ No FxService — transparent fee model doesn't use it
      ],
    }).compile();

    service = module.get<PayoutsService>(PayoutsService);

    // Happy path defaults
    mockRepo.findByReference.mockResolvedValue(null);
    mockCompliance.screenRecipient.mockResolvedValue({ passed: true, flagged: false });
    mockRepo.create.mockResolvedValue(mockPayoutRecord);
    mockQueue.add.mockResolvedValue({ id: 'job_001' });
  });

  afterEach(() => jest.clearAllMocks());

  // ── create() ────────────────────────────────────────────────
  describe('create()', () => {

    it('creates payout using partner-provided nairaAmount (no FX calculation)', async () => {
      const result = await service.create(PARTNER_ID, validDto);

      // Should NOT call any FX service
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nairaAmount:  205000,   // ← exact partner amount, no FX applied
          exchangeRate: 2050,     // ← informational, stored as-is
          fee:          0.35,     // ← Elorge platform fee only
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
        fee:              0.35,
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

    it('flags payout and does NOT queue when sanctions match', async () => {
      mockCompliance.screenRecipient.mockResolvedValue({
        passed:      false,
        flagged:     true,
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

  });

  // ── dispatch() ──────────────────────────────────────────────
  describe('dispatch()', () => {

    it('delivers exact nairaAmount via PSP (Flutterwave primary)', async () => {
      mockRepo.findById.mockResolvedValue(mockPayoutRecord);
      mockRepo.updateStatus.mockResolvedValue({ ...mockPayoutRecord, status: 'DELIVERED' });
      mockPspAdapter.transfer.mockResolvedValue({
        success:      true,
        pspReference: 'FLW_REF_001',
        status:       'successful',
        bankSession:  'NIP_SESSION_001',
      });

      await service.dispatch('payout_abc123');

      // PSP receives the exact nairaAmount the partner specified
      expect(mockPspAdapter.transfer).toHaveBeenCalledWith(
        expect.objectContaining({
          reference:     'payout_abc123',
          amount:        205000,        // ← partner's exact NGN amount
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
      mockRepo.updateStatus.mockResolvedValue(mockPayoutRecord);
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
      expect(result.nairaAmount).toBe(205000);  // ← partner's original amount
    });

    it('throws NotFoundException for unknown payout', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.getStatus('bad_id', PARTNER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for different partner\'s payout', async () => {
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
        nairaAmount: 205000,   // partner's amount preserved
        fee:         0.35,     // Elorge platform fee in GBP
      });
    });

  });

});