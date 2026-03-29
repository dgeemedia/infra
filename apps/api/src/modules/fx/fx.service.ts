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
    const rate        = await this.getRate(fromCurrency);
    const fee         = this.calculateFee(sendAmount);
    const netAmount   = sendAmount - fee;
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
    const rate  = await this.getRate(fromCurrency);
    const fee   = this.calculateFee(sendAmount);
    const nairaAmount = parseFloat(((sendAmount - fee) * rate).toFixed(2));

    return { nairaAmount, rate, fee };
  }

  // ── Fee calculation — flat rate structure ─────────────────
  private calculateFee(amount: number): number {
    // Fee tiers (in GBP equivalent):
    // £1   – £50:   £1.99 flat
    // £51  – £200:  £2.99 flat
    // £201 – £500:  £3.99 flat
    // £501+:        £4.99 flat
    if (amount <= 50)  return 1.99;
    if (amount <= 200) return 2.99;
    if (amount <= 500) return 3.99;
    return 4.99;
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
