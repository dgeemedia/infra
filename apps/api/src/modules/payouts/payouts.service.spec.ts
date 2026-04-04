// apps/api/src/modules/payouts/payouts.service.spec.ts
/**
 * Unit tests for PayoutsService
 * Run: cd apps/api && npm run test
 */

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getQueueToken }  from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';

import { PayoutStatus, Currency } from '@elorge/constants';

import { ComplianceService } from '../compliance/compliance.service';
import { FxService }         from '../fx/fx.service';
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

const mockFx = {
  convertToNaira: jest.fn(),
  buildQuote:     jest.fn(),
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

const validDto: CreatePayoutDto = {
  partnerReference: 'FP_TXN_TEST_001',
  sendAmount:       100,
  sendCurrency:     Currency.GBP,
  recipient: {
    fullName:      'Test Recipient',
    bankCode:      '058',       // GTBank — valid
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
  nairaAmount:      204500,
  exchangeRate:     2050.45,
  fee:              2.99,
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
describe('PayoutsService', () => {
  let service: PayoutsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        { provide: PayoutsRepository,  useValue: mockRepo },
        { provide: FxService,          useValue: mockFx },
        { provide: ComplianceService,  useValue: mockCompliance },
        { provide: PspFactory,         useValue: mockPspFactory },
        { provide: getQueueToken(PAYOUT_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<PayoutsService>(PayoutsService);

    // Default happy-path mocks
    mockRepo.findByReference.mockResolvedValue(null);            // no duplicate
    mockCompliance.screenRecipient.mockResolvedValue({ passed: true, flagged: false });
    mockFx.convertToNaira.mockResolvedValue({
      nairaAmount: 204500,
      rate:        2050.45,
      fee:         2.99,
    });
    mockRepo.create.mockResolvedValue(mockPayoutRecord);
    mockQueue.add.mockResolvedValue({ id: 'job_001' });
  });

  afterEach(() => jest.clearAllMocks());

  // ── create() ────────────────────────────────────────────────
  describe('create()', () => {

    it('creates a payout and queues it for dispatch', async () => {
      const result = await service.create(PARTNER_ID, validDto);

      expect(mockRepo.findByReference).toHaveBeenCalledWith(PARTNER_ID, 'FP_TXN_TEST_001');
      expect(mockCompliance.screenRecipient).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: 'Test Recipient', bankCode: '058' }),
      );
      expect(mockFx.convertToNaira).toHaveBeenCalledWith(Currency.GBP, 100);
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(
        'dispatch',
        { payoutId: 'payout_abc123' },
        expect.objectContaining({ attempts: 5, jobId: 'payout_abc123' }),
      );

      expect(result).toMatchObject({
        payoutId:         'payout_abc123',
        partnerReference: 'FP_TXN_TEST_001',
        status:           'PENDING',
        nairaAmount:      204500,
        exchangeRate:     2050.45,
      });
    });

    it('throws BadRequestException for invalid bank code', async () => {
      const dto = { ...validDto, recipient: { ...validDto.recipient, bankCode: '999' } };
      await expect(service.create(PARTNER_ID, dto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException for duplicate partnerReference', async () => {
      mockRepo.findByReference.mockResolvedValue(mockPayoutRecord); // existing!
      await expect(service.create(PARTNER_ID, validDto)).rejects.toThrow(ConflictException);
    });

    it('flags payout and does NOT queue when sanctions hit', async () => {
      mockCompliance.screenRecipient.mockResolvedValue({
        passed:      false,
        flagged:     true,
        matchDetails: 'Matched OFAC SDN list',
      });

      await service.create(PARTNER_ID, validDto);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'payout_abc123',
        PayoutStatus.FLAGGED,
        expect.objectContaining({ failureReason: 'Matched OFAC SDN list' }),
      );
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

  });

  // ── dispatch() ──────────────────────────────────────────────
  describe('dispatch()', () => {

    it('delivers payout successfully via PSP', async () => {
      mockRepo.findById.mockResolvedValue(mockPayoutRecord);
      mockRepo.updateStatus.mockResolvedValue({ ...mockPayoutRecord, status: 'DELIVERED' });
      mockPspAdapter.transfer.mockResolvedValue({
        success:      true,
        pspReference: 'BANKLY_REF_001',
        status:       'successful',
        bankSession:  'NIP_SESSION_001',
      });

      await service.dispatch('payout_abc123');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith('payout_abc123', PayoutStatus.PROCESSING);
      expect(mockPspAdapter.transfer).toHaveBeenCalledWith(
        expect.objectContaining({
          reference:     'payout_abc123',
          bankCode:      '058',
          accountNumber: '0123456789',
        }),
      );
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'payout_abc123',
        PayoutStatus.DELIVERED,
        expect.objectContaining({ pspReference: 'BANKLY_REF_001' }),
      );
    });

    it('marks FAILED and throws when PSP returns failure', async () => {
      mockRepo.findById.mockResolvedValue(mockPayoutRecord);
      mockRepo.updateStatus.mockResolvedValue(mockPayoutRecord);
      mockPspAdapter.transfer.mockResolvedValue({
        success:      false,
        pspReference: 'BANKLY_REF_002',
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

    it('does nothing if payout not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await service.dispatch('nonexistent');
      expect(mockPspAdapter.transfer).not.toHaveBeenCalled();
    });

    it('does nothing if payout is already DELIVERED', async () => {
      mockRepo.findById.mockResolvedValue({
        ...mockPayoutRecord,
        status: 'DELIVERED',
      });
      await service.dispatch('payout_abc123');
      expect(mockRepo.updateStatus).not.toHaveBeenCalled();
      expect(mockPspAdapter.transfer).not.toHaveBeenCalled();
    });

  });

  // ── getStatus() ─────────────────────────────────────────────
  describe('getStatus()', () => {

    it('returns status for a valid payout', async () => {
      mockRepo.findById.mockResolvedValue(mockPayoutRecord);
      const result = await service.getStatus('payout_abc123', PARTNER_ID);
      expect(result.payoutId).toBe('payout_abc123');
      expect(result.status).toBe('PENDING');
    });

    it('throws NotFoundException for unknown payout', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.getStatus('bad_id', PARTNER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when payout belongs to different partner', async () => {
      mockRepo.findById.mockResolvedValue({
        ...mockPayoutRecord,
        partnerId: 'different_partner',
      });
      await expect(service.getStatus('payout_abc123', PARTNER_ID)).rejects.toThrow(NotFoundException);
    });

  });

  // ── list() ──────────────────────────────────────────────────
  describe('list()', () => {

    it('returns paginated list of payouts', async () => {
      mockRepo.findMany.mockResolvedValue({
        data:  [mockPayoutRecord],
        total: 1,
      });

      const result = await service.list(PARTNER_ID, { page: 1, pageSize: 20 });

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(1);
    });

  });

});
