"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceConfig = exports.pspConfig = exports.redisConfig = exports.databaseConfig = exports.appConfig = void 0;
// apps/api/src/config/app.config.ts
var config_1 = require("@nestjs/config");
exports.appConfig = (0, config_1.registerAs)('app', function () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    return ({
        nodeEnv: (_a = process.env['NODE_ENV']) !== null && _a !== void 0 ? _a : 'development',
        port: parseInt((_b = process.env['PORT']) !== null && _b !== void 0 ? _b : '3001', 10),
        name: (_c = process.env['PLATFORM_NAME']) !== null && _c !== void 0 ? _c : 'Elorge Payout Platform',
        email: (_d = process.env['PLATFORM_EMAIL']) !== null && _d !== void 0 ? _d : 'platform@elorge.com',
        support: (_e = process.env['SUPPORT_EMAIL']) !== null && _e !== void 0 ? _e : 'support@elorge.com',
        apiKeyPrefix: (_f = process.env['API_KEY_PREFIX']) !== null && _f !== void 0 ? _f : 'el_live_',
        apiKeySandboxPrefix: (_g = process.env['API_KEY_SANDBOX_PREFIX']) !== null && _g !== void 0 ? _g : 'el_test_',
        jwtSecret: (_h = process.env['JWT_SECRET']) !== null && _h !== void 0 ? _h : 'change_this_in_production',
        jwtExpiresIn: (_j = process.env['JWT_EXPIRES_IN']) !== null && _j !== void 0 ? _j : '7d',
        webhookSecret: (_k = process.env['WEBHOOK_SECRET']) !== null && _k !== void 0 ? _k : 'change_this',
        webhookMaxRetries: parseInt((_l = process.env['WEBHOOK_MAX_RETRIES']) !== null && _l !== void 0 ? _l : '5', 10),
        webhookRetryDelayMs: parseInt((_m = process.env['WEBHOOK_RETRY_DELAY_MS']) !== null && _m !== void 0 ? _m : '5000', 10),
        // ── Platform fee ─────────────────────────────────────────
        // Default fee for override/testing. In production, the fee is
        // calculated by calculateFeeKobo() in payouts.service.ts based
        // on payout amount tiers.
        platformFeeKobo: parseInt((_o = process.env['PLATFORM_FEE_KOBO']) !== null && _o !== void 0 ? _o : '25000', 10), // ₦250
        // ── Minimum balance requirement ───────────────────────────
        // Partners must keep this much kobo in their wallet after a
        // payout is deducted. 0 = no floor. Raise to require a buffer.
        minPartnerBalanceKobo: parseInt((_p = process.env['MIN_PARTNER_BALANCE_KOBO']) !== null && _p !== void 0 ? _p : '0', 10),
        // ── Payout naira limits ───────────────────────────────────
        minPayoutKobo: parseInt((_q = process.env['MIN_PAYOUT_KOBO']) !== null && _q !== void 0 ? _q : '10000', 10), // ₦100
        maxPayoutKobo: parseInt((_r = process.env['MAX_PAYOUT_KOBO']) !== null && _r !== void 0 ? _r : '5000000000', 10), // ₦50,000,000
    });
});
exports.databaseConfig = (0, config_1.registerAs)('database', function () { return ({
    url: process.env['DATABASE_URL'],
}); });
exports.redisConfig = (0, config_1.registerAs)('redis', function () {
    var _a;
    return ({
        url: (_a = process.env['REDIS_URL']) !== null && _a !== void 0 ? _a : 'redis://localhost:6379',
    });
});
exports.pspConfig = (0, config_1.registerAs)('psp', function () {
    var _a;
    return ({
        flutterwave: {
            secretKey: process.env['FLUTTERWAVE_SECRET_KEY'],
            baseUrl: (_a = process.env['FLUTTERWAVE_BASE_URL']) !== null && _a !== void 0 ? _a : 'https://api.flutterwave.com/v3',
            // Secret Hash set in Flutterwave dashboard → Settings → Webhooks
            // Must match exactly what you enter there.
            webhookHash: process.env['FLUTTERWAVE_WEBHOOK_HASH'],
        },
    });
});
exports.complianceConfig = (0, config_1.registerAs)('compliance', function () { return ({
    openSanctions: {
        apiKey: process.env['OPEN_SANCTIONS_API_KEY'],
    },
}); });
