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
exports.BalanceController = void 0;
var openapi = require("@nestjs/swagger");
// apps/api/src/modules/admin/balance.controller.ts
//
// Admin-only endpoints for managing partner Naira wallet balances.
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var admin_guard_1 = require("../../common/guards/admin.guard");
// ── DTOs ──────────────────────────────────────────────────────
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
                // Amount in kobo (₦500.00 → 50000 kobo). Integer avoids float drift.
                this.amountKobo = __runInitializers(this, _amountKobo_initializers, void 0);
                // Human note for the ledger, e.g. "NGN transfer REF-12345 confirmed 2026-04-05"
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
var BalanceLedgerQueryDto = function () {
    var _a;
    var _page_decorators;
    var _page_initializers = [];
    var _page_extraInitializers = [];
    var _pageSize_decorators;
    var _pageSize_initializers = [];
    var _pageSize_extraInitializers = [];
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    return _a = /** @class */ (function () {
            function BalanceLedgerQueryDto() {
                this.page = __runInitializers(this, _page_initializers, 1);
                this.pageSize = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _pageSize_initializers, 20));
                this.type = (__runInitializers(this, _pageSize_extraInitializers), __runInitializers(this, _type_initializers, void 0));
                __runInitializers(this, _type_extraInitializers);
            }
            return BalanceLedgerQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _page_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_transformer_1.Type)(function () { return Number; })];
            _pageSize_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_transformer_1.Type)(function () { return Number; })];
            _type_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(['CREDIT', 'DEBIT', 'REFUND'])];
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _pageSize_decorators, { kind: "field", name: "pageSize", static: false, private: false, access: { has: function (obj) { return "pageSize" in obj; }, get: function (obj) { return obj.pageSize; }, set: function (obj, value) { obj.pageSize = value; } }, metadata: _metadata }, _pageSize_initializers, _pageSize_extraInitializers);
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
// ── Controller ────────────────────────────────────────────────
var BalanceController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Admin — Balances'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, common_1.Controller)('v1/admin/partners/:id/balance')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getBalance_decorators;
    var _topUp_decorators;
    var _getLedger_decorators;
    var BalanceController = _classThis = /** @class */ (function () {
        function BalanceController_1(prisma) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
        }
        // ── GET current balance ───────────────────────────────────
        BalanceController_1.prototype.getBalance = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var partner;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findUnique({
                                where: { id: id },
                                select: { id: true, name: true, email: true, balanceKobo: true },
                            })];
                        case 1:
                            partner = _a.sent();
                            if (!partner)
                                return [2 /*return*/, { success: false, message: 'Partner not found' }];
                            return [2 /*return*/, {
                                    success: true,
                                    data: {
                                        partnerId: partner.id,
                                        name: partner.name,
                                        email: partner.email,
                                        balanceKobo: partner.balanceKobo,
                                        balanceNaira: (partner.balanceKobo / 100).toFixed(2),
                                    },
                                }];
                    }
                });
            });
        };
        // ── POST top-up ───────────────────────────────────────────
        //
        // Workflow:
        //  1. Partner wires NGN to Elorge (via VAN auto-credit or manual transfer)
        //  2. Admin confirms receipt and calls this endpoint
        //  3. Partner's Naira wallet is credited; they can now create payouts
        BalanceController_1.prototype.topUp = function (id, dto) {
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
                                return [2 /*return*/, { success: false, message: 'Partner not found' }];
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
                                    success: true,
                                    data: {
                                        partnerId: id,
                                        name: partner.name,
                                        creditedKobo: dto.amountKobo,
                                        creditedNaira: (dto.amountKobo / 100).toFixed(2),
                                        newBalanceKobo: balanceAfterKobo,
                                        newBalanceNaira: (balanceAfterKobo / 100).toFixed(2),
                                        description: dto.description,
                                    },
                                }];
                    }
                });
            });
        };
        // ── GET ledger ────────────────────────────────────────────
        BalanceController_1.prototype.getLedger = function (id, query) {
            return __awaiter(this, void 0, void 0, function () {
                var page, pageSize, where, _a, entries, total;
                var _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            page = (_b = query.page) !== null && _b !== void 0 ? _b : 1;
                            pageSize = (_c = query.pageSize) !== null && _c !== void 0 ? _c : 20;
                            where = __assign({ partnerId: id }, (query.type ? { type: query.type } : {}));
                            return [4 /*yield*/, Promise.all([
                                    this.prisma.balanceTransaction.findMany({
                                        where: where,
                                        orderBy: { createdAt: 'desc' },
                                        skip: (page - 1) * pageSize,
                                        take: pageSize,
                                        include: { payout: { select: { partnerReference: true } } },
                                    }),
                                    this.prisma.balanceTransaction.count({ where: where }),
                                ])];
                        case 1:
                            _a = _d.sent(), entries = _a[0], total = _a[1];
                            return [2 /*return*/, {
                                    success: true,
                                    data: {
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
                                        page: page,
                                        pageSize: pageSize,
                                        totalPages: Math.ceil(total / pageSize),
                                    },
                                }];
                    }
                });
            });
        };
        return BalanceController_1;
    }());
    __setFunctionName(_classThis, "BalanceController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getBalance_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({ summary: 'Get partner current Naira wallet balance' }), openapi.ApiResponse({ status: 200, type: Object })];
        _topUp_decorators = [(0, common_1.Post)('topup'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
                summary: 'Credit a partner Naira wallet (admin confirms receipt)',
                description: 'amountKobo is in kobo (₦500.00 = 50000). ' +
                    'description should include the transfer reference for audit.',
            }), openapi.ApiResponse({ status: common_1.HttpStatus.OK, type: Object })];
        _getLedger_decorators = [(0, common_1.Get)('ledger'), (0, swagger_1.ApiOperation)({ summary: 'Get partner Naira wallet ledger (paginated)' }), openapi.ApiResponse({ status: 200 })];
        __esDecorate(_classThis, null, _getBalance_decorators, { kind: "method", name: "getBalance", static: false, private: false, access: { has: function (obj) { return "getBalance" in obj; }, get: function (obj) { return obj.getBalance; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _topUp_decorators, { kind: "method", name: "topUp", static: false, private: false, access: { has: function (obj) { return "topUp" in obj; }, get: function (obj) { return obj.topUp; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getLedger_decorators, { kind: "method", name: "getLedger", static: false, private: false, access: { has: function (obj) { return "getLedger" in obj; }, get: function (obj) { return obj.getLedger; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BalanceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BalanceController = _classThis;
}();
exports.BalanceController = BalanceController;
