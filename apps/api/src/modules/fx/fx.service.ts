// apps/api/src/modules/fx/fx.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import axios from 'axios';

import { Currency } from '@elorge/constants';
import type { FxQuote } from '@elorge/types';

const FX_CACHE_KEY = 'elorge:fx:rates';

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // ── Get live GBP→NGN rate (cached in Redis) ──────────────
  async getRate(fromCurrency: Currency): Promise<number> {
    // Try cache first
    const cached = await this.redis.hget(FX_CACHE_KEY, fromCurrency);
    if (cached) {
      return parseFloat(cached);
    }

    // Fetch fresh from provider
    const rates = await this.fetchRatesFromProvider();

    // Cache all rates
    const ttl = this.config.get<number>('fx.cacheTtlSeconds') ?? 300;
    const pipeline = this.redis.pipeline();
    for (const [currency, rate] of Object.entries(rates)) {
      pipeline.hset(FX_CACHE_KEY, currency, String(rate));
    }
    pipeline.expire(FX_CACHE_KEY, ttl);
    await pipeline.exec();

    return rates[fromCurrency] ?? 0;
  }

  // ── Build a full FX quote for the API response ────────────
  async buildQuote(fromCurrency: Currency, sendAmount: number): Promise<FxQuote> {
    const rate          = await this.getRate(fromCurrency);
    const fee           = this.calculateFee(sendAmount);
    const netAmount     = sendAmount - fee;
    const recipientGets = parseFloat((netAmount * rate).toFixed(2));

    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() +
      (this.config.get<number>('fx.cacheTtlSeconds') ?? 300),
    );

    return {
      fromCurrency,
      toCurrency:    Currency.NGN,
      sendAmount,
      exchangeRate:  rate,
      fee,
      recipientGets,
      rateExpiresAt: expiresAt.toISOString(),
    };
  }

  // ── Convert send amount to Naira ──────────────────────────
  async convertToNaira(
    fromCurrency: Currency,
    sendAmount:   number,
  ): Promise<{ nairaAmount: number; rate: number; fee: number }> {
    const rate        = await this.getRate(fromCurrency);
    const fee         = this.calculateFee(sendAmount);
    const nairaAmount = parseFloat(((sendAmount - fee) * rate).toFixed(2));

    return { nairaAmount, rate, fee };
  }

  // ── Fee calculation — reads tiers from config/.env ────────
  //
  //  Change fee tiers without a code deploy — just update .env:
  //
  //   FEE_TIER1_MAX_GBP=50    FEE_TIER1_GBP=1.99
  //   FEE_TIER2_MAX_GBP=200   FEE_TIER2_GBP=2.99
  //   FEE_TIER3_MAX_GBP=500   FEE_TIER3_GBP=3.99
  //                           FEE_TIER4_GBP=4.99   (catch-all)
  //
  calculateFee(amount: number): number {
    const t1Max = this.config.get<number>('app.feeT1Max') ?? 50;
    const t2Max = this.config.get<number>('app.feeT2Max') ?? 200;
    const t3Max = this.config.get<number>('app.feeT3Max') ?? 500;
    const t1    = this.config.get<number>('app.feeT1')    ?? 1.99;
    const t2    = this.config.get<number>('app.feeT2')    ?? 2.99;
    const t3    = this.config.get<number>('app.feeT3')    ?? 3.99;
    const t4    = this.config.get<number>('app.feeT4')    ?? 4.99;

    if (amount <= t1Max) return t1;
    if (amount <= t2Max) return t2;
    if (amount <= t3Max) return t3;
    return t4;
  }

  // ── Fetch rates from Open Exchange Rates ──────────────────
  private async fetchRatesFromProvider(): Promise<Record<string, number>> {
    const appId = this.config.get<string>('fx.openExchangeRatesAppId');

    try {
      const { data } = await axios.get<{
        rates: Record<string, number>;
        base:  string;
      }>(
        `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD&symbols=GBP,USD,EUR,CAD,NGN`,
      );

      // Convert all currencies to NGN rates
      const ngnPerUsd = data.rates['NGN'] ?? 0;
      const result: Record<string, number> = {};

      for (const [currency, usdRate] of Object.entries(data.rates)) {
        if (currency !== 'NGN') {
          // Rate = how many NGN per 1 unit of this currency
          result[currency] = parseFloat((ngnPerUsd / usdRate).toFixed(4));
        }
      }

      this.logger.log(`FX rates refreshed: GBP/NGN = ${result['GBP'] ?? 'N/A'}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch FX rates from provider', error);
      throw new Error('Exchange rate service temporarily unavailable');
    }
  }
}