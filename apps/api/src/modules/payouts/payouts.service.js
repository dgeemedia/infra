"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutsService = void 0;
// apps/api/src/modules/payouts/payouts.service.ts
var common_1 = require("@nestjs/common");
var constants_1 = require("@elorge/constants");
// ── Fee schedule ──────────────────────────────────────────────
function calculateFeeKobo(nairaAmountKobo) {
    var TIERS = [
        { maxKobo: 5000000, feeKobo: 15000 }, // ≤ ₦50,000   → fee ₦150
        { maxKobo: 20000000, feeKobo: 25000 }, // ≤ ₦200,000  → fee ₦250
        { maxKobo: 100000000, feeKobo: 40000 }, // ≤ ₦1,000,000→ fee ₦400
        { maxKobo: Infinity, feeKobo: 60000 }, // > ₦1,000,000→ fee ₦600
    ];
    for (var _i = 0, TIERS_1 = TIERS; _i < TIERS_1.length; _i++) {
        var tier = TIERS_1[_i];
        if (nairaAmountKobo <= tier.maxKobo)
            return tier.feeKobo;
    }
    return 60000;
}
function koboToNaira(kobo) {
    return "\u20A6".concat((kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 }));
}
var PayoutsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PayoutsService = _classThis = /** @class */ (function () {
        function PayoutsService_1(repo, compliance, pspFactory, prisma, configService, payoutQueue) {
            this.repo = repo;
            this.compliance = compliance;
            this.pspFactory = pspFactory;
            this.prisma = prisma;
            this.configService = configService;
            this.payoutQueue = payoutQueue;
            this.logger = new common_1.Logger(PayoutsService.name);
        }
        // ══════════════════════════════════════════════════════════
        //  CREATE PAYOUT — POST /v1/payouts
        // ══════════════════════════════════════════════════════════
        PayoutsService_1.prototype.create = function (partnerId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, nairaAmountKobo, feeKobo, totalDebitKobo, minBalanceKobo, partner, balanceAfterKobo, screening, bankName, payoutId, LOW_BALANCE_PAYOUTS, payoutsLeft, payout;
                var _this = this;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            // ── 1. Validate bank code ─────────────────────────────
                            if (!(0, constants_1.isValidBankCode)(dto.recipient.bankCode)) {
                                throw new common_1.BadRequestException({
                                    code: constants_1.ERROR_CODES.INVALID_BANK_CODE,
                                    message: "Bank code \"".concat(dto.recipient.bankCode, "\" is not a valid CBN-registered bank."),
                                });
                            }
                            return [4 /*yield*/, this.repo.findByReference(partnerId, dto.partnerReference)];
                        case 1:
                            existing = _c.sent();
                            if (existing) {
                                throw new common_1.ConflictException({
                                    code: constants_1.ERROR_CODES.DUPLICATE_REFERENCE,
                                    message: "A payout with reference \"".concat(dto.partnerReference, "\" already exists."),
                                });
                            }
                            nairaAmountKobo = dto.nairaAmountKobo;
                            feeKobo = calculateFeeKobo(nairaAmountKobo);
                            totalDebitKobo = nairaAmountKobo + feeKobo;
                            minBalanceKobo = (_a = this.configService.get('app.minPartnerBalanceKobo')) !== null && _a !== void 0 ? _a : 0;
                            return [4 /*yield*/, this.prisma.partner.findUnique({
                                    where: { id: partnerId },
                                    select: { balanceKobo: true, status: true, name: true },
                                })];
                        case 2:
                            partner = _c.sent();
                            if (!partner) {
                                throw new common_1.NotFoundException({ code: constants_1.ERROR_CODES.PARTNER_NOT_FOUND });
                            }
                            balanceAfterKobo = partner.balanceKobo - totalDebitKobo;
                            if (balanceAfterKobo < minBalanceKobo) {
                                throw new common_1.HttpException({
                                    code: 'INSUFFICIENT_BALANCE',
                                    message: "Insufficient Naira wallet balance. " +
                                        "Required: ".concat(koboToNaira(totalDebitKobo), " ") +
                                        "(".concat(koboToNaira(nairaAmountKobo), " payout + ").concat(koboToNaira(feeKobo), " fee). ") +
                                        "Available: ".concat(koboToNaira(partner.balanceKobo), ". ") +
                                        "Fund your wallet by transferring Naira to your dedicated VAN.",
                                    required: totalDebitKobo,
                                    available: partner.balanceKobo,
                                    fee: feeKobo,
                                    nairaAmount: nairaAmountKobo,
                                }, common_1.HttpStatus.PAYMENT_REQUIRED);
                            }
                            // ── 5. Compliance screening ───────────────────────────
                            this.logger.log("Screening recipient: ".concat(dto.recipient.fullName));
                            return [4 /*yield*/, this.compliance.screenRecipient({
                                    fullName: dto.recipient.fullName,
                                    accountNumber: dto.recipient.accountNumber,
                                    bankCode: dto.recipient.bankCode,
                                })];
                        case 3:
                            screening = _c.sent();
                            bankName = (0, constants_1.getBankName)(dto.recipient.bankCode);
                            payoutId = '';
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var payout;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, tx.payout.create({
                                                    data: {
                                                        partnerId: partnerId,
                                                        partnerReference: dto.partnerReference,
                                                        nairaAmountKobo: nairaAmountKobo,
                                                        feeKobo: feeKobo,
                                                        exchangeRateAudit: dto.exchangeRateAudit,
                                                        narration: dto.narration,
                                                        status: 'PENDING',
                                                        recipient: {
                                                            create: {
                                                                fullName: dto.recipient.fullName,
                                                                bankCode: dto.recipient.bankCode,
                                                                bankName: bankName,
                                                                accountNumber: dto.recipient.accountNumber,
                                                                phone: dto.recipient.phone,
                                                            },
                                                        },
                                                    },
                                                })];
                                            case 1:
                                                payout = _a.sent();
                                                payoutId = payout.id;
                                                return [4 /*yield*/, tx.partner.update({
                                                        where: { id: partnerId },
                                                        data: { balanceKobo: { decrement: totalDebitKobo } },
                                                    })];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, tx.balanceTransaction.create({
                                                        data: {
                                                            partnerId: partnerId,
                                                            type: 'DEBIT',
                                                            amountKobo: totalDebitKobo,
                                                            balanceAfterKobo: balanceAfterKobo,
                                                            description: "Payout ".concat(payout.id, " \u2014 ") +
                                                                "".concat(koboToNaira(nairaAmountKobo), " to ").concat(dto.recipient.fullName, " ") +
                                                                "+ ".concat(koboToNaira(feeKobo), " fee"),
                                                            payoutId: payout.id,
                                                        },
                                                    })];
                                            case 3:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 4:
                            _c.sent();
                            if (!screening.flagged) return [3 /*break*/, 6];
                            return [4 /*yield*/, this.prisma.payout.update({
                                    where: { id: payoutId },
                                    data: { status: 'FLAGGED', failureReason: (_b = screening.matchDetails) !== null && _b !== void 0 ? _b : 'Sanctions match' },
                                })];
                        case 5:
                            _c.sent();
                            this.logger.warn("Payout ".concat(payoutId, " flagged: ").concat(screening.matchDetails));
                            return [3 /*break*/, 8];
                        case 6: return [4 /*yield*/, this.payoutQueue.add('dispatch', { payoutId: payoutId }, {
                                attempts: 5,
                                backoff: { type: 'exponential', delay: 5000 },
                                jobId: payoutId,
                                removeOnComplete: true,
                                removeOnFail: false,
                            })];
                        case 7:
                            _c.sent();
                            this.logger.log("Payout ".concat(payoutId, " queued \u2014 ") +
                                "".concat(koboToNaira(nairaAmountKobo), " \u2192 ").concat(dto.recipient.accountNumber, " ") +
                                "(fee: ".concat(koboToNaira(feeKobo), ")"));
                            _c.label = 8;
                        case 8:
                            LOW_BALANCE_PAYOUTS = 20;
                            payoutsLeft = feeKobo > 0 ? Math.floor(balanceAfterKobo / feeKobo) : 0;
                            if (payoutsLeft < LOW_BALANCE_PAYOUTS && payoutsLeft >= 0) {
                                void this.sendLowBalanceAlert(partnerId, balanceAfterKobo, payoutsLeft);
                            }
                            return [4 /*yield*/, this.repo.findById(payoutId)];
                        case 9:
                            payout = _c.sent();
                            return [2 /*return*/, this.formatResponse(payout, nairaAmountKobo, feeKobo)];
                    }
                });
            });
        };
        // ── Low balance alert ─────────────────────────────────────
        PayoutsService_1.prototype.sendLowBalanceAlert = function (partnerId, balanceKobo, payoutsLeft) {
            return __awaiter(this, void 0, void 0, function () {
                var recent, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.prisma.notification.findFirst({
                                    where: {
                                        partnerId: partnerId,
                                        // Cast string literal to enum value expected by Prisma
                                        type: 'BALANCE_LOW',
                                        createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
                                    },
                                })];
                        case 1:
                            recent = _a.sent();
                            if (recent)
                                return [2 /*return*/];
                            return [4 /*yield*/, this.prisma.notification.create({
                                    data: {
                                        partnerId: partnerId,
                                        type: 'BALANCE_LOW', // enum extended beyond Prisma generated type — see schema note
                                        title: "Low wallet balance \u2014 ".concat(payoutsLeft, " payouts remaining"),
                                        body: "Your Elorge wallet is running low (".concat(koboToNaira(balanceKobo), "). ") +
                                            "At the current fee rate, you have approximately ".concat(payoutsLeft, " payouts left. ") +
                                            "Transfer Naira to your dedicated VAN to top up.",
                                        read: false,
                                        metadata: { balanceKobo: balanceKobo, payoutsLeft: payoutsLeft },
                                    },
                                })];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _a.sent();
                            this.logger.warn('Failed to send low balance alert', e_1);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        // ══════════════════════════════════════════════════════════
        //  DISPATCH — called by queue worker
        // ══════════════════════════════════════════════════════════
        PayoutsService_1.prototype.dispatch = function (payoutId) {
            return __awaiter(this, void 0, void 0, function () {
                var payout, psp, result, feeKobo_1;
                var _this = this;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.repo.findById(payoutId)];
                        case 1:
                            payout = _e.sent();
                            if (!payout || !payout.recipient) {
                                this.logger.error("Dispatch: payout not found: ".concat(payoutId));
                                return [2 /*return*/];
                            }
                            if (payout.status !== constants_1.PayoutStatus.PENDING) {
                                this.logger.warn("Dispatch: ".concat(payoutId, " already ").concat(payout.status, " \u2014 skipping"));
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.repo.updateStatus(payoutId, constants_1.PayoutStatus.PROCESSING)];
                        case 2:
                            _e.sent();
                            psp = this.pspFactory.getAdapter();
                            return [4 /*yield*/, psp.transfer({
                                    reference: payoutId,
                                    amount: payout.nairaAmountKobo / 100, // FLW expects NGN decimal
                                    bankCode: payout.recipient.bankCode,
                                    accountNumber: payout.recipient.accountNumber,
                                    accountName: payout.recipient.fullName,
                                    narration: (_a = payout.narration) !== null && _a !== void 0 ? _a : "Elorge payout ".concat(payoutId),
                                })];
                        case 3:
                            result = _e.sent();
                            if (!(result.success && result.status === 'successful')) return [3 /*break*/, 5];
                            return [4 /*yield*/, this.repo.updateStatus(payoutId, constants_1.PayoutStatus.DELIVERED, {
                                    pspReference: result.pspReference,
                                    bankSessionId: result.bankSession,
                                    deliveredAt: new Date(),
                                })];
                        case 4:
                            _e.sent();
                            this.logger.log("Payout ".concat(payoutId, " DELIVERED \u2014 ") +
                                "".concat(koboToNaira(payout.nairaAmountKobo), " via PSP ref ").concat(result.pspReference));
                            return [3 /*break*/, 9];
                        case 5:
                            feeKobo_1 = payout.feeKobo;
                            if (!(feeKobo_1 > 0)) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.prisma.$transaction(function (tx) { return __awaiter(_this, void 0, void 0, function () {
                                    var updated;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, tx.partner.update({
                                                    where: { id: payout.partnerId },
                                                    data: { balanceKobo: { increment: feeKobo_1 } },
                                                    select: { balanceKobo: true },
                                                })];
                                            case 1:
                                                updated = _b.sent();
                                                return [4 /*yield*/, tx.balanceTransaction.create({
                                                        data: {
                                                            partnerId: payout.partnerId,
                                                            type: 'REFUND',
                                                            amountKobo: feeKobo_1,
                                                            balanceAfterKobo: updated.balanceKobo,
                                                            description: "Fee refund \u2014 payout ".concat(payoutId, " failed: ").concat((_a = result.message) !== null && _a !== void 0 ? _a : 'PSP error'),
                                                            payoutId: payoutId,
                                                        },
                                                    })];
                                            case 2:
                                                _b.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); })];
                        case 6:
                            _e.sent();
                            this.logger.log("Refunded fee ".concat(koboToNaira(feeKobo_1), " to partner ").concat(payout.partnerId));
                            _e.label = 7;
                        case 7: return [4 /*yield*/, this.repo.updateStatus(payoutId, constants_1.PayoutStatus.FAILED, {
                                pspReference: result.pspReference,
                                failureReason: (_b = result.message) !== null && _b !== void 0 ? _b : 'PSP transfer failed',
                            })];
                        case 8:
                            _e.sent();
                            this.logger.warn("Payout ".concat(payoutId, " FAILED: ").concat((_c = result.message) !== null && _c !== void 0 ? _c : 'unknown'));
                            throw new Error("Transfer failed: ".concat((_d = result.message) !== null && _d !== void 0 ? _d : 'unknown'));
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        // ══════════════════════════════════════════════════════════
        //  GET STATUS
        // ══════════════════════════════════════════════════════════
        PayoutsService_1.prototype.getStatus = function (payoutId, partnerId) {
            return __awaiter(this, void 0, void 0, function () {
                var payout;
                var _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, this.repo.findById(payoutId)];
                        case 1:
                            payout = _e.sent();
                            if (!payout || payout.partnerId !== partnerId) {
                                throw new common_1.NotFoundException({
                                    code: constants_1.ERROR_CODES.PAYOUT_NOT_FOUND,
                                    message: "Payout ".concat(payoutId, " not found."),
                                });
                            }
                            return [2 /*return*/, {
                                    payoutId: payout.id,
                                    partnerReference: payout.partnerReference,
                                    status: payout.status,
                                    nairaAmount: payout.nairaAmountKobo / 100,
                                    deliveredAt: (_a = payout.deliveredAt) === null || _a === void 0 ? void 0 : _a.toISOString(),
                                    failureReason: (_b = payout.failureReason) !== null && _b !== void 0 ? _b : undefined,
                                    pspReference: (_c = payout.pspReference) !== null && _c !== void 0 ? _c : undefined,
                                    bankSessionId: (_d = payout.bankSessionId) !== null && _d !== void 0 ? _d : undefined,
                                }];
                    }
                });
            });
        };
        // ══════════════════════════════════════════════════════════
        //  LIST
        // ══════════════════════════════════════════════════════════
        PayoutsService_1.prototype.list = function (partnerId, query) {
            return __awaiter(this, void 0, void 0, function () {
                var page, pageSize, _a, data, total;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            page = (_b = query.page) !== null && _b !== void 0 ? _b : 1;
                            pageSize = (_c = query.pageSize) !== null && _c !== void 0 ? _c : 20;
                            return [4 /*yield*/, this.repo.findMany({
                                    partnerId: partnerId,
                                    page: page,
                                    pageSize: pageSize,
                                    status: query.status, startDate: query.startDate,
                                    endDate: query.endDate, search: query.search,
                                })];
                        case 1:
                            _a = _d.sent(), data = _a.data, total = _a.total;
                            return [2 /*return*/, {
                                    data: data.map(function (p) {
                                        var _a, _b, _c, _d;
                                        return ({
                                            payoutId: p.id,
                                            partnerReference: p.partnerReference,
                                            partnerId: p.partnerId,
                                            status: p.status,
                                            nairaAmount: p.nairaAmountKobo / 100,
                                            exchangeRate: Number((_a = p.exchangeRateAudit) !== null && _a !== void 0 ? _a : 0),
                                            fee: p.feeKobo / 100,
                                            estimatedDelivery: 'same_day',
                                            createdAt: p.createdAt.toISOString(),
                                            updatedAt: p.updatedAt.toISOString(),
                                            deliveredAt: (_b = p.deliveredAt) === null || _b === void 0 ? void 0 : _b.toISOString(),
                                            pspReference: (_c = p.pspReference) !== null && _c !== void 0 ? _c : undefined,
                                            failureReason: (_d = p.failureReason) !== null && _d !== void 0 ? _d : undefined,
                                        });
                                    }),
                                    total: total,
                                    page: page,
                                    pageSize: pageSize,
                                    totalPages: Math.ceil(total / pageSize),
                                }];
                    }
                });
            });
        };
        PayoutsService_1.prototype.formatResponse = function (payout, nairaAmountKobo, feeKobo) {
            return {
                payoutId: payout.id,
                partnerReference: payout.partnerReference,
                status: payout.status,
                nairaAmount: nairaAmountKobo / 100,
                exchangeRate: 0,
                fee: feeKobo / 100,
                estimatedDelivery: 'same_day',
                createdAt: payout.createdAt.toISOString(),
            };
        };
        return PayoutsService_1;
    }());
    __setFunctionName(_classThis, "PayoutsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PayoutsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PayoutsService = _classThis;
}();
exports.PayoutsService = PayoutsService;
