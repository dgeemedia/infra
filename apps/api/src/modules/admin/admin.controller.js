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
exports.AdminController = void 0;
var openapi = require("@nestjs/swagger");
// apps/api/src/modules/admin/admin.controller.ts
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var public_decorator_1 = require("../../common/decorators/public.decorator");
var admin_guard_1 = require("../../common/guards/admin.guard");
// ── Balance top-up DTO ────────────────────────────────────────
// amountKobo: Naira in kobo (₦500.00 → 50000 kobo)
// description: human note e.g. "Wise NGN transfer REF-12345 confirmed 2026-04-07"
var TopUpDto = function () {
    var _a;
    var _amountKobo_decorators;
    var _amountKobo_initializers = [];
    var _amountKobo_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    return _a = /** @class */ (function () {
            function TopUpDto() {
                this.amountKobo = __runInitializers(this, _amountKobo_initializers, void 0);
                this.description = (__runInitializers(this, _amountKobo_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                __runInitializers(this, _description_extraInitializers);
            }
            return TopUpDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _amountKobo_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.IsPositive)(), (0, class_transformer_1.Type)(function () { return Number; })];
            _description_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.Length)(5, 200)];
            __esDecorate(null, null, _amountKobo_decorators, { kind: "field", name: "amountKobo", static: false, private: false, access: { has: function (obj) { return "amountKobo" in obj; }, get: function (obj) { return obj.amountKobo; }, set: function (obj, value) { obj.amountKobo = value; } }, metadata: _metadata }, _amountKobo_initializers, _amountKobo_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var AdminController = function () {
    var _classDecorators = [(0, public_decorator_1.Public)(), (0, swagger_1.ApiTags)('Admin'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, common_1.Controller)('v1/admin')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getStats_decorators;
    var _getAllPartners_decorators;
    var _getPartnerDetail_decorators;
    var _suspendPartner_decorators;
    var _activatePartner_decorators;
    var _getAllBalances_decorators;
    var _topUpBalance_decorators;
    var _getBalanceLedger_decorators;
    var _getAllTransactions_decorators;
    var _getFlagged_decorators;
    var _releaseFlagged_decorators;
    var _rejectFlagged_decorators;
    var _getInbox_decorators;
    var AdminController = _classThis = /** @class */ (function () {
        function AdminController_1(adminService, prisma) {
            this.adminService = (__runInitializers(this, _instanceExtraInitializers), adminService);
            this.prisma = prisma;
        }
        // ── Platform stats ────────────────────────────────────────
        AdminController_1.prototype.getStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, stats, flwBalance;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.adminService.getPlatformStats(),
                                this.adminService.getFlutterwaveBalance(),
                            ])];
                        case 1:
                            _a = _b.sent(), stats = _a[0], flwBalance = _a[1];
                            return [2 /*return*/, __assign(__assign({}, stats), { flutterwaveBalance: flwBalance })];
                    }
                });
            });
        };
        // ── Partners ──────────────────────────────────────────────
        AdminController_1.prototype.getAllPartners = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.adminService.getAllPartners()];
                });
            });
        };
        AdminController_1.prototype.getPartnerDetail = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.adminService.getPartnerDetail(id)];
                });
            });
        };
        AdminController_1.prototype.suspendPartner = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.adminService.suspendPartner(id)];
                });
            });
        };
        AdminController_1.prototype.activatePartner = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.adminService.activatePartner(id)];
                });
            });
        };
        // ── Partner balances ──────────────────────────────────────
        AdminController_1.prototype.getAllBalances = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, partnerBalances, flwBalance;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.adminService.getAllPartnerBalances(),
                                this.adminService.getFlutterwaveBalance(),
                            ])];
                        case 1:
                            _a = _b.sent(), partnerBalances = _a[0], flwBalance = _a[1];
                            return [2 /*return*/, __assign(__assign({}, partnerBalances), { flutterwaveBalance: flwBalance })];
                    }
                });
            });
        };
        // ── Balance top-up ────────────────────────────────────────
        // Workflow:
        //  1. Partner sends Naira (via local transfer / Wise NGN etc.) to your account
        //  2. You confirm receipt
        //  3. Call this endpoint → partner's Naira wallet is credited
        //  4. Partner can now create payouts up to their balance
        AdminController_1.prototype.topUpBalance = function (id, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var partner, balanceAfterKobo;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findUnique({
                                where: { id: id },
                                select: { id: true, name: true, balanceKobo: true },
                            })];
                        case 1:
                            partner = _a.sent();
                            if (!partner)
                                throw new Error('Partner not found');
                            balanceAfterKobo = partner.balanceKobo + dto.amountKobo;
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.partner.update({
                                        where: { id: id },
                                        data: { balanceKobo: { increment: dto.amountKobo } },
                                    }),
                                    this.prisma.balanceTransaction.create({
                                        data: {
                                            partnerId: id,
                                            type: 'CREDIT',
                                            amountKobo: dto.amountKobo,
                                            balanceAfterKobo: balanceAfterKobo,
                                            description: dto.description,
                                        },
                                    }),
                                ])];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, {
                                    partnerId: id,
                                    name: partner.name,
                                    creditedKobo: dto.amountKobo,
                                    creditedNaira: (dto.amountKobo / 100).toFixed(2),
                                    newBalanceKobo: balanceAfterKobo,
                                    newBalanceNaira: (balanceAfterKobo / 100).toFixed(2),
                                }];
                    }
                });
            });
        };
        // ── Balance ledger ────────────────────────────────────────
        AdminController_1.prototype.getBalanceLedger = function (id, page, pageSize, type) {
            return __awaiter(this, void 0, void 0, function () {
                var p, ps, skip, where, _a, entries, total;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            p = page ? parseInt(page) : 1;
                            ps = pageSize ? parseInt(pageSize) : 20;
                            skip = (p - 1) * ps;
                            where = { partnerId: id };
                            if (type)
                                where['type'] = type;
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.balanceTransaction.findMany({
                                        where: where,
                                        orderBy: { createdAt: 'desc' },
                                        skip: skip,
                                        take: ps,
                                        include: { payout: { select: { partnerReference: true } } },
                                    }),
                                    this.prisma.balanceTransaction.count({ where: where }),
                                ])];
                        case 1:
                            _a = _b.sent(), entries = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    entries: entries.map(function (e) {
                                        var _a, _b;
                                        return ({
                                            id: e.id,
                                            type: e.type,
                                            amountKobo: e.amountKobo,
                                            amountNaira: (e.amountKobo / 100).toFixed(2),
                                            balanceAfterKobo: e.balanceAfterKobo,
                                            balanceAfterNaira: (e.balanceAfterKobo / 100).toFixed(2),
                                            description: e.description,
                                            payoutReference: (_b = (_a = e.payout) === null || _a === void 0 ? void 0 : _a.partnerReference) !== null && _b !== void 0 ? _b : null,
                                            createdAt: e.createdAt.toISOString(),
                                        });
                                    }),
                                    total: total,
                                    page: p,
                                    pageSize: ps,
                                    totalPages: Math.ceil(total / ps),
                                }];
                    }
                });
            });
        };
        // ── Transactions ──────────────────────────────────────────
        AdminController_1.prototype.getAllTransactions = function (page, pageSize, status, partnerId, startDate, endDate) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.adminService.getAllTransactions({
                            page: page ? parseInt(page) : 1,
                            pageSize: pageSize ? parseInt(pageSize) : 20,
                            status: status,
                            partnerId: partnerId,
                            startDate: startDate,
                            endDate: endDate,
                        })];
                });
            });
        };
        // ── Flagged payouts ───────────────────────────────────────
        AdminController_1.prototype.getFlagged = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.adminService.getFlaggedPayouts()];
                });
            });
        };
        AdminController_1.prototype.releaseFlagged = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.adminService.releaseFlaggedPayout(id)];
                });
            });
        };
        AdminController_1.prototype.rejectFlagged = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.adminService.rejectFlaggedPayout(id)];
                });
            });
        };
        // ── Inbox ─────────────────────────────────────────────────
        AdminController_1.prototype.getInbox = function (page, pageSize) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.adminService.getInboxMessages(page ? parseInt(page) : 1, pageSize ? parseInt(pageSize) : 20)];
                });
            });
        };
        return AdminController_1;
    }());
    __setFunctionName(_classThis, "AdminController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getStats_decorators = [(0, common_1.Get)('stats'), (0, swagger_1.ApiOperation)({ summary: 'Platform-wide stats' }), openapi.ApiResponse({ status: 200 })];
        _getAllPartners_decorators = [(0, common_1.Get)('partners'), (0, swagger_1.ApiOperation)({ summary: 'List all partners with metrics + balances' }), openapi.ApiResponse({ status: 200 })];
        _getPartnerDetail_decorators = [(0, common_1.Get)('partners/:id'), (0, swagger_1.ApiOperation)({ summary: 'Get single partner detail' }), openapi.ApiResponse({ status: 200 })];
        _suspendPartner_decorators = [(0, common_1.Patch)('partners/:id/suspend'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Suspend a partner account' }), openapi.ApiResponse({ status: common_1.HttpStatus.OK })];
        _activatePartner_decorators = [(0, common_1.Patch)('partners/:id/activate'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Reactivate a partner account' }), openapi.ApiResponse({ status: common_1.HttpStatus.OK })];
        _getAllBalances_decorators = [(0, common_1.Get)('balances'), (0, swagger_1.ApiOperation)({ summary: 'All partner Naira balances + Flutterwave wallet' }), openapi.ApiResponse({ status: 200 })];
        _topUpBalance_decorators = [(0, common_1.Post)('partners/:id/balance/topup'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
                summary: 'Credit a partner Naira wallet (admin confirms receipt)',
                description: 'Call after confirming the partner\'s Naira transfer landed. '
                    + 'amountKobo is in kobo (₦500.00 = 50000). '
                    + 'description should include the transfer reference for audit.',
            }), openapi.ApiResponse({ status: common_1.HttpStatus.OK })];
        _getBalanceLedger_decorators = [(0, common_1.Get)('partners/:id/balance/ledger'), (0, swagger_1.ApiOperation)({ summary: 'Balance ledger for a partner' }), openapi.ApiResponse({ status: 200 })];
        _getAllTransactions_decorators = [(0, common_1.Get)('transactions'), (0, swagger_1.ApiOperation)({ summary: 'All transactions across all partners' }), openapi.ApiResponse({ status: 200 })];
        _getFlagged_decorators = [(0, common_1.Get)('flagged'), (0, swagger_1.ApiOperation)({ summary: 'All flagged payouts needing review' }), openapi.ApiResponse({ status: 200, type: [Object] })];
        _releaseFlagged_decorators = [(0, common_1.Patch)('flagged/:id/release'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Release flagged payout to processing' }), openapi.ApiResponse({ status: common_1.HttpStatus.OK })];
        _rejectFlagged_decorators = [(0, common_1.Patch)('flagged/:id/reject'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Reject flagged payout as failed' }), openapi.ApiResponse({ status: common_1.HttpStatus.OK })];
        _getInbox_decorators = [(0, common_1.Get)('inbox'), (0, swagger_1.ApiOperation)({ summary: 'Admin inbox — partner interest submissions' }), openapi.ApiResponse({ status: 200 })];
        __esDecorate(_classThis, null, _getStats_decorators, { kind: "method", name: "getStats", static: false, private: false, access: { has: function (obj) { return "getStats" in obj; }, get: function (obj) { return obj.getStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllPartners_decorators, { kind: "method", name: "getAllPartners", static: false, private: false, access: { has: function (obj) { return "getAllPartners" in obj; }, get: function (obj) { return obj.getAllPartners; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPartnerDetail_decorators, { kind: "method", name: "getPartnerDetail", static: false, private: false, access: { has: function (obj) { return "getPartnerDetail" in obj; }, get: function (obj) { return obj.getPartnerDetail; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _suspendPartner_decorators, { kind: "method", name: "suspendPartner", static: false, private: false, access: { has: function (obj) { return "suspendPartner" in obj; }, get: function (obj) { return obj.suspendPartner; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _activatePartner_decorators, { kind: "method", name: "activatePartner", static: false, private: false, access: { has: function (obj) { return "activatePartner" in obj; }, get: function (obj) { return obj.activatePartner; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllBalances_decorators, { kind: "method", name: "getAllBalances", static: false, private: false, access: { has: function (obj) { return "getAllBalances" in obj; }, get: function (obj) { return obj.getAllBalances; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _topUpBalance_decorators, { kind: "method", name: "topUpBalance", static: false, private: false, access: { has: function (obj) { return "topUpBalance" in obj; }, get: function (obj) { return obj.topUpBalance; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getBalanceLedger_decorators, { kind: "method", name: "getBalanceLedger", static: false, private: false, access: { has: function (obj) { return "getBalanceLedger" in obj; }, get: function (obj) { return obj.getBalanceLedger; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAllTransactions_decorators, { kind: "method", name: "getAllTransactions", static: false, private: false, access: { has: function (obj) { return "getAllTransactions" in obj; }, get: function (obj) { return obj.getAllTransactions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getFlagged_decorators, { kind: "method", name: "getFlagged", static: false, private: false, access: { has: function (obj) { return "getFlagged" in obj; }, get: function (obj) { return obj.getFlagged; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _releaseFlagged_decorators, { kind: "method", name: "releaseFlagged", static: false, private: false, access: { has: function (obj) { return "releaseFlagged" in obj; }, get: function (obj) { return obj.releaseFlagged; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _rejectFlagged_decorators, { kind: "method", name: "rejectFlagged", static: false, private: false, access: { has: function (obj) { return "rejectFlagged" in obj; }, get: function (obj) { return obj.rejectFlagged; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getInbox_decorators, { kind: "method", name: "getInbox", static: false, private: false, access: { has: function (obj) { return "getInbox" in obj; }, get: function (obj) { return obj.getInbox; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminController = _classThis;
}();
exports.AdminController = AdminController;
