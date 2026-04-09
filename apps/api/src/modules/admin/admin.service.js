"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.AdminService = void 0;
// apps/api/src/modules/admin/admin.service.ts
var common_1 = require("@nestjs/common");
var rxjs_1 = require("rxjs");
// kobo → "₦1,234.56"
function koboToNaira(kobo) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
    }).format(kobo / 100);
}
var AdminService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AdminService = _classThis = /** @class */ (function () {
        function AdminService_1(prisma, configService, httpService) {
            this.prisma = prisma;
            this.configService = configService;
            this.httpService = httpService;
            this.logger = new common_1.Logger(AdminService.name);
        }
        // ── Platform-wide stats ───────────────────────────────────
        AdminService_1.prototype.getPlatformStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, totalPartners, activePartners, totalPayouts, deliveredPayouts, failedPayouts, flaggedPayouts, volumeResult, feeResult, successRate;
                var _b, _c, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.partner.count({ where: { role: 'PARTNER' } }),
                                this.prisma.partner.count({ where: { role: 'PARTNER', status: 'ACTIVE' } }),
                                this.prisma.payout.count(),
                                this.prisma.payout.count({ where: { status: 'DELIVERED' } }),
                                this.prisma.payout.count({ where: { status: 'FAILED' } }),
                                this.prisma.payout.count({ where: { status: 'FLAGGED' } }),
                                // Total naira delivered to recipients (kobo sum)
                                this.prisma.payout.aggregate({
                                    _sum: { nairaAmountKobo: true },
                                    where: { status: 'DELIVERED' },
                                }),
                                // Total fees earned (kobo sum)
                                this.prisma.payout.aggregate({
                                    _sum: { feeKobo: true },
                                    where: { status: 'DELIVERED' },
                                }),
                            ])];
                        case 1:
                            _a = _f.sent(), totalPartners = _a[0], activePartners = _a[1], totalPayouts = _a[2], deliveredPayouts = _a[3], failedPayouts = _a[4], flaggedPayouts = _a[5], volumeResult = _a[6], feeResult = _a[7];
                            successRate = totalPayouts > 0
                                ? parseFloat(((deliveredPayouts / totalPayouts) * 100).toFixed(1))
                                : 0;
                            return [2 /*return*/, {
                                    totalPartners: totalPartners,
                                    activePartners: activePartners,
                                    totalPayouts: totalPayouts,
                                    deliveredPayouts: deliveredPayouts,
                                    failedPayouts: failedPayouts,
                                    flaggedPayouts: flaggedPayouts,
                                    successRate: successRate,
                                    totalVolumeKobo: (_b = volumeResult._sum.nairaAmountKobo) !== null && _b !== void 0 ? _b : 0,
                                    totalVolumeNaira: koboToNaira((_c = volumeResult._sum.nairaAmountKobo) !== null && _c !== void 0 ? _c : 0),
                                    totalFeesKobo: (_d = feeResult._sum.feeKobo) !== null && _d !== void 0 ? _d : 0,
                                    totalFeesNaira: koboToNaira((_e = feeResult._sum.feeKobo) !== null && _e !== void 0 ? _e : 0),
                                }];
                    }
                });
            });
        };
        // ── List all partners ─────────────────────────────────────
        AdminService_1.prototype.getAllPartners = function () {
            return __awaiter(this, void 0, void 0, function () {
                var partners, volumeByPartner, volumeMap;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findMany({
                                where: { role: 'PARTNER' },
                                orderBy: { createdAt: 'desc' },
                                include: {
                                    _count: {
                                        select: {
                                            apiKeys: { where: { revokedAt: null } },
                                            payouts: true,
                                            webhookConfigs: { where: { isActive: true } },
                                        },
                                    },
                                },
                            })];
                        case 1:
                            partners = _a.sent();
                            return [4 /*yield*/, this.prisma.payout.groupBy({
                                    by: ['partnerId'],
                                    _sum: { nairaAmountKobo: true },
                                    _count: { id: true },
                                    where: { status: 'DELIVERED' },
                                })];
                        case 2:
                            volumeByPartner = _a.sent();
                            volumeMap = new Map(volumeByPartner.map(function (v) {
                                var _a;
                                return [
                                    v.partnerId,
                                    { volumeKobo: (_a = v._sum.nairaAmountKobo) !== null && _a !== void 0 ? _a : 0, count: v._count.id },
                                ];
                            }));
                            return [2 /*return*/, partners.map(function (p) {
                                    var _a, _b, _c, _d, _e, _f;
                                    return ({
                                        id: p.id,
                                        name: p.name,
                                        email: p.email,
                                        country: p.country,
                                        status: p.status,
                                        createdAt: p.createdAt,
                                        activeApiKeys: p._count.apiKeys,
                                        totalPayouts: p._count.payouts,
                                        activeWebhooks: p._count.webhookConfigs,
                                        deliveredVolumeKobo: (_b = (_a = volumeMap.get(p.id)) === null || _a === void 0 ? void 0 : _a.volumeKobo) !== null && _b !== void 0 ? _b : 0,
                                        deliveredVolumeNaira: koboToNaira((_d = (_c = volumeMap.get(p.id)) === null || _c === void 0 ? void 0 : _c.volumeKobo) !== null && _d !== void 0 ? _d : 0),
                                        deliveredCount: (_f = (_e = volumeMap.get(p.id)) === null || _e === void 0 ? void 0 : _e.count) !== null && _f !== void 0 ? _f : 0,
                                        balanceKobo: p.balanceKobo,
                                        balanceNaira: koboToNaira(p.balanceKobo),
                                    });
                                })];
                    }
                });
            });
        };
        // ── All partner balances ──────────────────────────────────
        AdminService_1.prototype.getAllPartnerBalances = function () {
            return __awaiter(this, void 0, void 0, function () {
                var partners, totalKobo;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findMany({
                                where: { role: 'PARTNER' },
                                orderBy: [{ name: 'asc' }],
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    country: true,
                                    status: true,
                                    balanceKobo: true,
                                    balanceTransactions: {
                                        where: { type: 'CREDIT' },
                                        orderBy: { createdAt: 'desc' },
                                        take: 1,
                                        select: { createdAt: true, amountKobo: true, description: true },
                                    },
                                },
                            })];
                        case 1:
                            partners = _a.sent();
                            totalKobo = partners.reduce(function (sum, p) { return sum + p.balanceKobo; }, 0);
                            return [2 /*return*/, {
                                    partners: partners.map(function (p) {
                                        var _a;
                                        return ({
                                            id: p.id,
                                            name: p.name,
                                            email: p.email,
                                            country: p.country,
                                            status: p.status,
                                            balanceKobo: p.balanceKobo,
                                            balanceNaira: koboToNaira(p.balanceKobo),
                                            lastTopUp: (_a = p.balanceTransactions[0]) !== null && _a !== void 0 ? _a : null,
                                        });
                                    }),
                                    totalKobo: totalKobo,
                                    totalNaira: koboToNaira(totalKobo),
                                }];
                    }
                });
            });
        };
        // ── Flutterwave NGN wallet balance ────────────────────────
        AdminService_1.prototype.getFlutterwaveBalance = function () {
            return __awaiter(this, void 0, void 0, function () {
                var secretKey, baseUrl, response, ngn, err_1;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            secretKey = this.configService.get('psp.flutterwave.secretKey');
                            baseUrl = (_a = this.configService.get('psp.flutterwave.baseUrl')) !== null && _a !== void 0 ? _a : 'https://api.flutterwave.com/v3';
                            if (!secretKey) {
                                this.logger.warn('FLUTTERWAVE_SECRET_KEY not configured — skipping balance fetch');
                                return [2 /*return*/, null];
                            }
                            _d.label = 1;
                        case 1:
                            _d.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, (0, rxjs_1.firstValueFrom)(this.httpService.get("".concat(baseUrl, "/balances/NGN"), { headers: { Authorization: "Bearer ".concat(secretKey) } }))];
                        case 2:
                            response = _d.sent();
                            ngn = (_c = (_b = response.data) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0];
                            if (!ngn)
                                return [2 /*return*/, null];
                            return [2 /*return*/, {
                                    currency: ngn.currency,
                                    available: ngn.available_balance,
                                    ledger: ngn.ledger_balance,
                                }];
                        case 3:
                            err_1 = _d.sent();
                            this.logger.error('Failed to fetch Flutterwave balance', err_1);
                            return [2 /*return*/, null];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Get single partner detail ─────────────────────────────
        AdminService_1.prototype.getPartnerDetail = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var partner, _a, payoutStats, recentPayouts, recentLedger;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findUnique({
                                where: { id: id },
                                include: {
                                    apiKeys: { where: { revokedAt: null }, orderBy: { createdAt: 'desc' } },
                                    webhookConfigs: { orderBy: { createdAt: 'desc' } },
                                },
                            })];
                        case 1:
                            partner = _b.sent();
                            if (!partner)
                                throw new common_1.NotFoundException('Partner not found');
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.payout.groupBy({
                                        by: ['status'],
                                        _count: { id: true },
                                        where: { partnerId: id },
                                    }),
                                    this.prisma.payout.findMany({
                                        where: { partnerId: id },
                                        orderBy: { createdAt: 'desc' },
                                        take: 10,
                                        include: { recipient: true },
                                    }),
                                    this.prisma.balanceTransaction.findMany({
                                        where: { partnerId: id },
                                        orderBy: { createdAt: 'desc' },
                                        take: 5,
                                    }),
                                ])];
                        case 2:
                            _a = _b.sent(), payoutStats = _a[0], recentPayouts = _a[1], recentLedger = _a[2];
                            return [2 /*return*/, __assign(__assign({}, partner), { balanceNaira: koboToNaira(partner.balanceKobo), payoutStats: payoutStats, recentPayouts: recentPayouts, recentLedger: recentLedger })];
                    }
                });
            });
        };
        // ── Suspend / activate ────────────────────────────────────
        AdminService_1.prototype.suspendPartner = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var partner;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findUnique({ where: { id: id } })];
                        case 1:
                            partner = _a.sent();
                            if (!partner)
                                throw new common_1.NotFoundException('Partner not found');
                            return [2 /*return*/, this.prisma.partner.update({ where: { id: id }, data: { status: 'SUSPENDED' } })];
                    }
                });
            });
        };
        AdminService_1.prototype.activatePartner = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var partner;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findUnique({ where: { id: id } })];
                        case 1:
                            partner = _a.sent();
                            if (!partner)
                                throw new common_1.NotFoundException('Partner not found');
                            return [2 /*return*/, this.prisma.partner.update({ where: { id: id }, data: { status: 'ACTIVE' } })];
                    }
                });
            });
        };
        // ── All transactions ──────────────────────────────────────
        AdminService_1.prototype.getAllTransactions = function (filters) {
            return __awaiter(this, void 0, void 0, function () {
                var page, pageSize, skip, where, _a, data, total;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            page = (_b = filters.page) !== null && _b !== void 0 ? _b : 1;
                            pageSize = (_c = filters.pageSize) !== null && _c !== void 0 ? _c : 20;
                            skip = (page - 1) * pageSize;
                            where = {};
                            if (filters.status)
                                where['status'] = filters.status;
                            if (filters.partnerId)
                                where['partnerId'] = filters.partnerId;
                            if (filters.startDate || filters.endDate) {
                                where['createdAt'] = __assign(__assign({}, (filters.startDate ? { gte: new Date(filters.startDate) } : {})), (filters.endDate ? { lte: new Date(filters.endDate) } : {}));
                            }
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.payout.findMany({
                                        where: where,
                                        skip: skip,
                                        take: pageSize,
                                        orderBy: { createdAt: 'desc' },
                                        include: {
                                            recipient: true,
                                            partner: { select: { id: true, name: true, email: true, country: true } },
                                        },
                                    }),
                                    this.prisma.payout.count({ where: where }),
                                ])];
                        case 1:
                            _a = _d.sent(), data = _a[0], total = _a[1];
                            return [2 /*return*/, { data: data, total: total, page: page, pageSize: pageSize, totalPages: Math.ceil(total / pageSize) }];
                    }
                });
            });
        };
        // ── Flagged payouts ───────────────────────────────────────
        AdminService_1.prototype.getFlaggedPayouts = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.payout.findMany({
                            where: { status: 'FLAGGED' },
                            orderBy: { createdAt: 'desc' },
                            include: {
                                recipient: true,
                                partner: { select: { id: true, name: true, email: true } },
                            },
                        })];
                });
            });
        };
        AdminService_1.prototype.releaseFlaggedPayout = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var payout;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.payout.findUnique({ where: { id: id } })];
                        case 1:
                            payout = _a.sent();
                            if (!payout)
                                throw new common_1.NotFoundException('Payout not found');
                            if (payout.status !== 'FLAGGED')
                                return [2 /*return*/, payout];
                            return [2 /*return*/, this.prisma.payout.update({ where: { id: id }, data: { status: 'PROCESSING' } })];
                    }
                });
            });
        };
        AdminService_1.prototype.rejectFlaggedPayout = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var payout;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.payout.findUnique({ where: { id: id } })];
                        case 1:
                            payout = _a.sent();
                            if (!payout)
                                throw new common_1.NotFoundException('Payout not found');
                            if (payout.status !== 'FLAGGED')
                                return [2 /*return*/, payout];
                            return [2 /*return*/, this.prisma.payout.update({
                                    where: { id: id },
                                    data: { status: 'FAILED', failureReason: 'Rejected by Elorge compliance team' },
                                })];
                    }
                });
            });
        };
        // ── Inbox: partner interest submissions ───────────────────
        AdminService_1.prototype.getInboxMessages = function () {
            return __awaiter(this, arguments, void 0, function (page, pageSize) {
                var admin, where, _a, messages, total;
                if (page === void 0) { page = 1; }
                if (pageSize === void 0) { pageSize = 20; }
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findFirst({
                                where: { role: 'ADMIN' },
                                select: { id: true },
                            })];
                        case 1:
                            admin = _b.sent();
                            if (!admin)
                                return [2 /*return*/, { messages: [], total: 0, page: page, pageSize: pageSize, totalPages: 0 }];
                            where = { partnerId: admin.id, type: 'SYSTEM' };
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.notification.findMany({
                                        where: where,
                                        orderBy: { createdAt: 'desc' },
                                        skip: (page - 1) * pageSize,
                                        take: pageSize,
                                    }),
                                    this.prisma.notification.count({ where: where }),
                                ])];
                        case 2:
                            _a = _b.sent(), messages = _a[0], total = _a[1];
                            return [2 /*return*/, { messages: messages, total: total, page: page, pageSize: pageSize, totalPages: Math.ceil(total / pageSize) }];
                    }
                });
            });
        };
        return AdminService_1;
    }());
    __setFunctionName(_classThis, "AdminService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminService = _classThis;
}();
exports.AdminService = AdminService;
