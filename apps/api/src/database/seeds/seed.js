"use strict";
/**
 * apps/api/src/database/seeds/seed.ts
 *
 * Prisma seed script — pure NGN model.
 * Partners fund a Naira wallet (kobo) and pay out directly in NGN.
 * No FX, no GBP/USD/EUR send amounts.
 *
 * Run: cd apps/api && npx prisma db seed
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = require("bcryptjs");
var uuid_1 = require("uuid");
var prisma = new client_1.PrismaClient();
// ── Fee tiers (must match payouts.service.ts) ─────────────────
function calculateFeeKobo(nairaAmountKobo) {
    if (nairaAmountKobo <= 5000000)
        return 15000; // ≤ ₦50,000   → ₦150
    if (nairaAmountKobo <= 20000000)
        return 25000; // ≤ ₦200,000  → ₦250
    if (nairaAmountKobo <= 100000000)
        return 40000; // ≤ ₦1,000,000→ ₦400
    return 60000; // > ₦1,000,000→ ₦600
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var admin, _a, _b, INITIAL_BALANCE_KOBO, partner, _c, _d, liveKey, sandboxKey, _e, _f, _g, samplePayouts, runningBalanceKobo, _i, samplePayouts_1, p, feeKobo, totalDebitKobo, payout;
        var _h, _j, _k, _l, _m, _o, _p;
        var _q;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    console.log('🌱 Seeding database (pure NGN model)...');
                    // ── Clean slate ───────────────────────────────────────────
                    return [4 /*yield*/, prisma.notification.deleteMany()];
                case 1:
                    // ── Clean slate ───────────────────────────────────────────
                    _r.sent();
                    return [4 /*yield*/, prisma.webhookDelivery.deleteMany()];
                case 2:
                    _r.sent();
                    return [4 /*yield*/, prisma.webhookConfig.deleteMany()];
                case 3:
                    _r.sent();
                    return [4 /*yield*/, prisma.balanceTransaction.deleteMany()];
                case 4:
                    _r.sent();
                    return [4 /*yield*/, prisma.recipient.deleteMany()];
                case 5:
                    _r.sent();
                    return [4 /*yield*/, prisma.payout.deleteMany()];
                case 6:
                    _r.sent();
                    return [4 /*yield*/, prisma.apiKey.deleteMany()];
                case 7:
                    _r.sent();
                    return [4 /*yield*/, prisma.auditLog.deleteMany()];
                case 8:
                    _r.sent();
                    return [4 /*yield*/, prisma.partner.deleteMany()];
                case 9:
                    _r.sent();
                    _b = (_a = prisma.partner).create;
                    _h = {};
                    _j = {
                        id: 'partner_elorge_admin_001',
                        name: 'Elorge Admin',
                        email: 'admin@elorge.com'
                    };
                    return [4 /*yield*/, bcrypt.hash('Admin1234!', 12)];
                case 10: return [4 /*yield*/, _b.apply(_a, [(_h.data = (_j.passwordHash = _r.sent(),
                            _j.role = 'ADMIN',
                            _j.country = 'NG',
                            _j.status = 'ACTIVE',
                            _j),
                            _h)])];
                case 11:
                    admin = _r.sent();
                    console.log("\u2705 Admin: ".concat(admin.email, " / Admin1234!"));
                    INITIAL_BALANCE_KOBO = 200000000;
                    _d = (_c = prisma.partner).create;
                    _k = {};
                    _l = {
                        id: 'partner_finestpay_001',
                        name: 'FinestPay UK',
                        email: 'tech@finestpay.co.uk'
                    };
                    return [4 /*yield*/, bcrypt.hash('Partner1234!', 12)];
                case 12: return [4 /*yield*/, _d.apply(_c, [(_k.data = (_l.passwordHash = _r.sent(),
                            _l.role = 'PARTNER',
                            _l.country = 'GB',
                            _l.status = 'ACTIVE',
                            _l.balanceKobo = INITIAL_BALANCE_KOBO,
                            _l),
                            _k)])];
                case 13:
                    partner = _r.sent();
                    console.log("\u2705 Partner: ".concat(partner.email, " / Partner1234!"));
                    console.log("   Wallet: \u20A6".concat((INITIAL_BALANCE_KOBO / 100).toLocaleString('en-NG')));
                    // ── Initial wallet credit ledger entry ────────────────────
                    return [4 /*yield*/, prisma.balanceTransaction.create({
                            data: {
                                partnerId: partner.id,
                                type: 'CREDIT',
                                amountKobo: INITIAL_BALANCE_KOBO,
                                balanceAfterKobo: INITIAL_BALANCE_KOBO,
                                description: 'Initial wallet funding — seed data',
                            },
                        })];
                case 14:
                    // ── Initial wallet credit ledger entry ────────────────────
                    _r.sent();
                    liveKey = 'el_live_finestpay_test_key_do_not_use_in_production_abc123';
                    sandboxKey = 'el_test_finestpay_sandbox_key_do_not_use_in_production_xyz789';
                    _f = (_e = prisma.apiKey).createMany;
                    _m = {};
                    _o = {
                        id: 'apikey_live_001',
                        partnerId: partner.id,
                        label: 'Production Key'
                    };
                    return [4 /*yield*/, bcrypt.hash(liveKey, 12)];
                case 15:
                    _g = [
                        (_o.keyHash = _r.sent(),
                            _o.keyPreview = "".concat(liveKey.substring(0, 16), "...").concat(liveKey.slice(-4)),
                            _o.environment = 'live',
                            _o)
                    ];
                    _p = {
                        id: 'apikey_sandbox_001',
                        partnerId: partner.id,
                        label: 'Sandbox Key'
                    };
                    return [4 /*yield*/, bcrypt.hash(sandboxKey, 12)];
                case 16: return [4 /*yield*/, _f.apply(_e, [(_m.data = _g.concat([
                            (_p.keyHash = _r.sent(),
                                _p.keyPreview = "".concat(sandboxKey.substring(0, 16), "...").concat(sandboxKey.slice(-4)),
                                _p.environment = 'sandbox',
                                _p)
                        ]),
                            _m)])];
                case 17:
                    _r.sent();
                    console.log('✅ API keys created');
                    // ── Webhook ───────────────────────────────────────────────
                    return [4 /*yield*/, prisma.webhookConfig.create({
                            data: {
                                partnerId: partner.id,
                                url: 'https://api.finestpay.co.uk/webhooks/elorge',
                                events: ['payout.delivered', 'payout.failed', 'payout.processing'],
                                isActive: true,
                                secret: 'webhook_secret_finestpay_test_do_not_use_in_production',
                            },
                        })];
                case 18:
                    // ── Webhook ───────────────────────────────────────────────
                    _r.sent();
                    console.log('✅ Webhook config created');
                    samplePayouts = [
                        {
                            partnerReference: 'FP_TXN_001',
                            nairaAmountKobo: 20450000, // ₦204,500
                            status: 'DELIVERED',
                            narration: 'Family support',
                            deliveredAt: new Date(Date.now() - 1 * 3600 * 1000),
                            recipient: { fullName: 'Chukwuemeka Obi', bankCode: '058', bankName: 'Guaranty Trust Bank', accountNumber: '0123456789', phone: '+2348012345678' },
                        },
                        {
                            partnerReference: 'FP_TXN_002',
                            nairaAmountKobo: 50648750, // ₦506,487.50
                            status: 'DELIVERED',
                            narration: 'Business payment',
                            deliveredAt: new Date(Date.now() - 2 * 3600 * 1000),
                            recipient: { fullName: 'Adaeze Nwosu', bankCode: '044', bankName: 'Access Bank', accountNumber: '0987654321', phone: '+2348098765432' },
                        },
                        {
                            partnerReference: 'FP_TXN_003',
                            nairaAmountKobo: 10102250, // ₦101,022.50
                            status: 'PROCESSING',
                            narration: 'School fees',
                            deliveredAt: null,
                            recipient: { fullName: 'Babatunde Adeleke', bankCode: '057', bankName: 'Zenith Bank', accountNumber: '1122334455', phone: null },
                        },
                        {
                            partnerReference: 'FP_TXN_004',
                            nairaAmountKobo: 102272750, // ₦1,022,727.50
                            status: 'FAILED',
                            narration: 'Rent payment',
                            deliveredAt: null,
                            recipient: { fullName: 'Folake Adesanya', bankCode: '011', bankName: 'First Bank of Nigeria', accountNumber: '2233445566', phone: null },
                        },
                        {
                            partnerReference: 'FP_TXN_005',
                            nairaAmountKobo: 15178350, // ₦151,783.50
                            status: 'PENDING',
                            narration: 'Monthly allowance',
                            deliveredAt: null,
                            recipient: { fullName: 'Emeka Okonkwo', bankCode: '033', bankName: 'United Bank for Africa', accountNumber: '3344556677', phone: null },
                        },
                        {
                            partnerReference: 'FP_TXN_006',
                            nairaAmountKobo: 40519100, // ₦405,191
                            status: 'DELIVERED',
                            narration: 'Medical expenses',
                            deliveredAt: new Date(Date.now() - 5 * 3600 * 1000),
                            recipient: { fullName: 'Ngozi Eze', bankCode: '070', bankName: 'Fidelity Bank', accountNumber: '4455667788', phone: null },
                        },
                        {
                            partnerReference: 'FP_TXN_007',
                            nairaAmountKobo: 30391650, // ₦303,916.50
                            status: 'DELIVERED',
                            narration: 'Birthday gift',
                            deliveredAt: new Date(Date.now() - 24 * 3600 * 1000),
                            recipient: { fullName: 'Tunde Bakare', bankCode: '100004', bankName: 'OPay', accountNumber: '5566778899', phone: null },
                        },
                        {
                            partnerReference: 'FP_TXN_008',
                            nairaAmountKobo: 204545000, // ₦2,045,450
                            status: 'FLAGGED',
                            narration: 'Property purchase',
                            deliveredAt: null,
                            recipient: { fullName: 'Ibrahim Musa', bankCode: '057', bankName: 'Zenith Bank', accountNumber: '6677889900', phone: null },
                        },
                        {
                            partnerReference: 'FP_TXN_009',
                            nairaAmountKobo: 45000000, // ₦450,000
                            status: 'DELIVERED',
                            narration: 'Investment funds',
                            deliveredAt: new Date(Date.now() - 48 * 3600 * 1000),
                            recipient: { fullName: 'Chinwe Okafor', bankCode: '044', bankName: 'Access Bank', accountNumber: '7788990011', phone: null },
                        },
                        {
                            partnerReference: 'FP_TXN_010',
                            nairaAmountKobo: 16223600, // ₦162,236
                            status: 'DELIVERED',
                            narration: 'Groceries',
                            deliveredAt: new Date(Date.now() - 3 * 3600 * 1000),
                            recipient: { fullName: 'Yewande Alade', bankCode: '999992', bankName: 'Moniepoint', accountNumber: '8899001122', phone: null },
                        },
                    ];
                    console.log('\n💸 Creating payouts...');
                    runningBalanceKobo = INITIAL_BALANCE_KOBO;
                    _i = 0, samplePayouts_1 = samplePayouts;
                    _r.label = 19;
                case 19:
                    if (!(_i < samplePayouts_1.length)) return [3 /*break*/, 25];
                    p = samplePayouts_1[_i];
                    feeKobo = calculateFeeKobo(p.nairaAmountKobo);
                    totalDebitKobo = p.nairaAmountKobo + feeKobo;
                    return [4 /*yield*/, prisma.payout.create({
                            data: {
                                partnerId: partner.id,
                                partnerReference: p.partnerReference,
                                nairaAmountKobo: p.nairaAmountKobo,
                                feeKobo: feeKobo,
                                status: p.status,
                                narration: p.narration,
                                deliveredAt: p.deliveredAt,
                                pspReference: p.status === 'DELIVERED'
                                    ? "BANKLY_".concat((0, uuid_1.v4)().substring(0, 8).toUpperCase())
                                    : undefined,
                                failureReason: p.status === 'FAILED'
                                    ? 'Recipient account number invalid'
                                    : undefined,
                                recipient: {
                                    create: {
                                        fullName: p.recipient.fullName,
                                        bankCode: p.recipient.bankCode,
                                        bankName: p.recipient.bankName,
                                        accountNumber: p.recipient.accountNumber,
                                        phone: (_q = p.recipient.phone) !== null && _q !== void 0 ? _q : null,
                                    },
                                },
                            },
                        })];
                case 20:
                    payout = _r.sent();
                    // Create ledger DEBIT for each payout
                    runningBalanceKobo -= totalDebitKobo;
                    return [4 /*yield*/, prisma.balanceTransaction.create({
                            data: {
                                partnerId: partner.id,
                                type: 'DEBIT',
                                amountKobo: totalDebitKobo,
                                balanceAfterKobo: runningBalanceKobo,
                                description: "Payout ".concat(payout.id, " \u2014 ") +
                                    "\u20A6".concat((p.nairaAmountKobo / 100).toLocaleString('en-NG'), " to ").concat(p.recipient.fullName, " ") +
                                    "+ \u20A6".concat((feeKobo / 100).toLocaleString('en-NG'), " fee"),
                                payoutId: payout.id,
                            },
                        })];
                case 21:
                    _r.sent();
                    if (!(p.status === 'FAILED')) return [3 /*break*/, 23];
                    runningBalanceKobo += feeKobo;
                    return [4 /*yield*/, prisma.balanceTransaction.create({
                            data: {
                                partnerId: partner.id,
                                type: 'REFUND',
                                amountKobo: feeKobo,
                                balanceAfterKobo: runningBalanceKobo,
                                description: "Fee refund \u2014 payout ".concat(payout.id, " failed"),
                                payoutId: payout.id,
                            },
                        })];
                case 22:
                    _r.sent();
                    _r.label = 23;
                case 23:
                    console.log("   ".concat(payout.partnerReference, " [").concat(payout.status, "] ") +
                        "\u20A6".concat((p.nairaAmountKobo / 100).toLocaleString('en-NG'), " \u2192 ").concat(p.recipient.fullName));
                    _r.label = 24;
                case 24:
                    _i++;
                    return [3 /*break*/, 19];
                case 25: 
                // Sync partner balance to actual running total
                return [4 /*yield*/, prisma.partner.update({
                        where: { id: partner.id },
                        data: { balanceKobo: runningBalanceKobo },
                    })];
                case 26:
                    // Sync partner balance to actual running total
                    _r.sent();
                    console.log("\n   Wallet after payouts: \u20A6".concat((runningBalanceKobo / 100).toLocaleString('en-NG')));
                    // ── Notifications ─────────────────────────────────────────
                    return [4 /*yield*/, prisma.notification.createMany({
                            data: [
                                {
                                    partnerId: partner.id,
                                    type: 'PAYOUT_DELIVERED',
                                    title: 'Payout Delivered',
                                    body: 'FP_TXN_001 was successfully credited to Chukwuemeka Obi.',
                                    read: false,
                                    metadata: { partnerReference: 'FP_TXN_001' },
                                    createdAt: new Date(Date.now() - 1 * 3600 * 1000),
                                },
                                {
                                    partnerId: partner.id,
                                    type: 'PAYOUT_FAILED',
                                    title: 'Payout Failed',
                                    body: 'FP_TXN_004 failed after all retries. Recipient account number invalid.',
                                    read: false,
                                    metadata: { partnerReference: 'FP_TXN_004' },
                                    createdAt: new Date(Date.now() - 3 * 3600 * 1000),
                                },
                                {
                                    partnerId: partner.id,
                                    type: 'PAYOUT_FLAGGED',
                                    title: 'Payout Flagged',
                                    body: 'FP_TXN_008 is on hold pending compliance review.',
                                    read: false,
                                    metadata: { partnerReference: 'FP_TXN_008' },
                                    createdAt: new Date(Date.now() - 6 * 3600 * 1000),
                                },
                                {
                                    partnerId: partner.id,
                                    type: 'PAYOUT_DELIVERED',
                                    title: 'Payout Delivered',
                                    body: 'FP_TXN_002 was successfully credited to Adaeze Nwosu.',
                                    read: true,
                                    metadata: { partnerReference: 'FP_TXN_002' },
                                    createdAt: new Date(Date.now() - 24 * 3600 * 1000),
                                },
                                {
                                    partnerId: partner.id,
                                    type: 'WEBHOOK_FAILED',
                                    title: 'Webhook Delivery Failed',
                                    body: 'Failed to deliver payout.delivered to https://api.finestpay.co.uk/webhooks/elorge.',
                                    read: true,
                                    metadata: { partnerReference: 'FP_TXN_006' },
                                    createdAt: new Date(Date.now() - 48 * 3600 * 1000),
                                },
                            ],
                        })];
                case 27:
                    // ── Notifications ─────────────────────────────────────────
                    _r.sent();
                    // ── Summary ───────────────────────────────────────────────
                    console.log('\n✅ Seed complete!');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('Dashboard logins:');
                    console.log('  Admin:   admin@elorge.com     / Admin1234!');
                    console.log('  Partner: tech@finestpay.co.uk / Partner1234!');
                    console.log('\nAPI keys:');
                    console.log("  Live:    Bearer ".concat(liveKey));
                    console.log("  Sandbox: Bearer ".concat(sandboxKey));
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) { console.error('❌ Seed failed:', e); process.exit(1); })
    .finally(function () { void prisma.$disconnect(); });
