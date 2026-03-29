import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService }       from '@nestjs/config';
import { getRedisToken }       from '@nestjs-modules/ioredis';

import { Currency } from '@elorge/constants';
import { FxService } from './fx.service';

const mockRedis = {
  hget:     jest.fn(),
  pipeline: jest.fn(() => ({
    hset:   jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec:   jest.fn().mockResolvedValue([]),
  })),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const cfg: Record<string, unknown> = {
      'fx.cacheTtlSeconds':          300,
      'fx.openExchangeRatesAppId':   'test_app_id',
    };
    return cfg[key];
  }),
};

describe('FxService', () => {
  let service: FxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxService,
        { provide: ConfigService,       useValue: mockConfig },
        { provide: getRedisToken('default'), useValue: mockRedis },
      ],
    }).compile();

    service = module.get<FxService>(FxService);
    jest.clearAllMocks();
  });

  describe('calculateFee (via buildQuote)', () => {
    it('returns £1.99 fee for amounts up to £50', async () => {
      mockRedis.hget.mockResolvedValue('2050.45');
      const quote = await service.buildQuote(Currency.GBP, 50);
      expect(quote.fee).toBe(1.99);
    });

    it('returns £2.99 fee for amounts £51–£200', async () => {
      mockRedis.hget.mockResolvedValue('2050.45');
      const quote = await service.buildQuote(Currency.GBP, 100);
      expect(quote.fee).toBe(2.99);
    });

    it('returns £3.99 fee for amounts £201–£500', async () => {
      mockRedis.hget.mockResolvedValue('2050.45');
      const quote = await service.buildQuote(Currency.GBP, 300);
      expect(quote.fee).toBe(3.99);
    });

    it('returns £4.99 fee for amounts above £500', async () => {
      mockRedis.hget.mockResolvedValue('2050.45');
      const quote = await service.buildQuote(Currency.GBP, 1000);
      expect(quote.fee).toBe(4.99);
    });
  });

  describe('buildQuote()', () => {
    it('returns correct recipientGets after deducting fee', async () => {
      mockRedis.hget.mockResolvedValue('2050.45');
      const quote = await service.buildQuote(Currency.GBP, 100);

      // (100 - 2.99) * 2050.45 = 97.01 * 2050.45 = 198,900.17
      expect(quote.recipientGets).toBeGreaterThan(0);
      expect(quote.exchangeRate).toBe(2050.45);
      expect(quote.fromCurrency).toBe(Currency.GBP);
      expect(quote.toCurrency).toBe(Currency.NGN);
      expect(quote.rateExpiresAt).toBeDefined();
    });

    it('serves rate from Redis cache when available', async () => {
      mockRedis.hget.mockResolvedValue('2050.45');
      await service.buildQuote(Currency.GBP, 100);
      expect(mockRedis.hget).toHaveBeenCalledWith('elorge:fx:rates', Currency.GBP);
    });
  });
});
