// apps/api/src/modules/fx/fx.service.spec.ts
//
// FxService in the transparent-fee model is only responsible for
// calculateFee(). Partners supply their own nairaAmount, so we no
// longer test rate fetching or quote building here — those are
// informational helpers and require a live Redis / provider.

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService }       from '@nestjs/config';

import { FxService } from './fx.service';

// ── Minimal ConfigService mock ────────────────────────────────
// Only the fee-tier keys are needed; everything else returns undefined.
const mockConfig = {
  get: jest.fn((key: string): number | undefined => {
    const cfg: Record<string, number> = {
      'app.feeT1Max': 50,
      'app.feeT2Max': 200,
      'app.feeT3Max': 500,
      'app.feeT1':    1.99,
      'app.feeT2':    2.99,
      'app.feeT3':    3.99,
      'app.feeT4':    4.99,
    };
    return cfg[key];
  }),
};

describe('FxService — calculateFee()', () => {
  let service: FxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FxService,
        { provide: ConfigService, useValue: mockConfig },
        // No Redis provider needed — calculateFee() is synchronous
        // and never touches the cache.
      ],
    }).compile();

    service = module.get<FxService>(FxService);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns £1.99 for amounts at the tier-1 ceiling (£50)', () => {
    expect(service.calculateFee(50)).toBe(1.99);
  });

  it('returns £1.99 for amounts below the tier-1 ceiling (£10)', () => {
    expect(service.calculateFee(10)).toBe(1.99);
  });

  it('returns £2.99 for amounts just above tier-1 (£51)', () => {
    expect(service.calculateFee(51)).toBe(2.99);
  });

  it('returns £2.99 for amounts at the tier-2 ceiling (£200)', () => {
    expect(service.calculateFee(200)).toBe(2.99);
  });

  it('returns £3.99 for amounts just above tier-2 (£201)', () => {
    expect(service.calculateFee(201)).toBe(3.99);
  });

  it('returns £3.99 for amounts at the tier-3 ceiling (£500)', () => {
    expect(service.calculateFee(500)).toBe(3.99);
  });

  it('returns £4.99 for amounts above tier-3 (£501)', () => {
    expect(service.calculateFee(501)).toBe(4.99);
  });

  it('returns £4.99 for large amounts (£10,000)', () => {
    expect(service.calculateFee(10_000)).toBe(4.99);
  });

  it('reads tier values from ConfigService (not hardcoded)', () => {
    // Verify ConfigService.get was actually called, proving the
    // tiers are config-driven and not baked into the source.
    service.calculateFee(100);
    expect(mockConfig.get).toHaveBeenCalledWith('app.feeT1Max');
    expect(mockConfig.get).toHaveBeenCalledWith('app.feeT2');
  });
});