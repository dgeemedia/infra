"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
exports.PartnerBalanceController = void 0;
var openapi = require("@nestjs/swagger");
// apps/api/src/modules/partners/partner-balance.controller.ts
//
// Partner-facing balance endpoint.
// Partners call this to see their wallet balance and — crucially —
// their VAN (Virtual Account Number) to fund it.
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var PartnerBalanceController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Partner — Wallet'), (0, swagger_1.ApiBearerAuth)(), (0, common_1.Controller)('v1/me/balance')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _getMyBalance_decorators;
    var PartnerBalanceController = _classThis = /** @class */ (function () {
        function PartnerBalanceController_1(prisma) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
        }
        PartnerBalanceController_1.prototype.getMyBalance = function (partner) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, record, recentLedger;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.partner.findUnique({
                                    where: { id: partner.id },
                                    select: {
                                        balanceKobo: true,
                                        country: true,
                                        // VAN funding details
                                        flwVanAccountNumber: true,
                                        flwVanBankName: true,
                                        flwVanBankCode: true,
                                        flwVanReference: true,
                                        flwVanCreatedAt: true,
                                    },
                                }),
                                this.prisma.balanceTransaction.findMany({
                                    where: { partnerId: partner.id },
                                    orderBy: { createdAt: 'desc' },
                                    take: 10,
                                    select: {
                                        id: true,
                                        type: true,
                                        amountKobo: true,
                                        balanceAfterKobo: true,
                                        description: true,
                                        createdAt: true,
                                    },
                                }),
                            ])];
                        case 1:
                            _a = _b.sent(), record = _a[0], recentLedger = _a[1];
                            if (!record)
                                throw new Error('Partner not found');
                            return [2 /*return*/, {
                                    // Wallet balance
                                    balanceKobo: record.balanceKobo,
                                    balanceNaira: (record.balanceKobo / 100).toFixed(2),
                                    country: record.country,
                                    // ── Funding instructions ───────────────────────────
                                    // This is what the partner dashboard shows to help
                                    // partners top up their wallet without any manual
                                    // intervention from Elorge.
                                    fundingAccount: record.flwVanAccountNumber
                                        ? {
                                            bankName: record.flwVanBankName,
                                            bankCode: record.flwVanBankCode,
                                            accountNumber: record.flwVanAccountNumber,
                                            accountName: 'Elorge Technologies Limited',
                                            reference: record.flwVanReference,
                                            instructions: [
                                                "Transfer any amount of NGN to the account above.",
                                                "Your Elorge wallet will be credited automatically within 60 seconds.",
                                                "Use your reference number \"".concat(record.flwVanReference, "\" as the transfer narration."),
                                            ],
                                        }
                                        : null, // null in dev/sandbox if VAN not yet provisioned
                                    // Ledger
                                    recentLedger: recentLedger.map(function (e) { return ({
                                        id: e.id,
                                        type: e.type,
                                        amountKobo: e.amountKobo,
                                        amountNaira: (e.amountKobo / 100).toFixed(2),
                                        balanceAfterKobo: e.balanceAfterKobo,
                                        balanceAfterNaira: (e.balanceAfterKobo / 100).toFixed(2),
                                        description: e.description,
                                        createdAt: e.createdAt.toISOString(),
                                    }); }),
                                }];
                    }
                });
            });
        };
        return PartnerBalanceController_1;
    }());
    __setFunctionName(_classThis, "PartnerBalanceController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _getMyBalance_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiOperation)({
                summary: 'Get own Naira wallet balance, VAN funding details and ledger',
                description: 'Returns the partner\'s current prepaid Naira balance, ' +
                    'their dedicated Virtual Account Number to wire funds to, ' +
                    'and the last 10 ledger entries.',
            }), openapi.ApiResponse({ status: 200 })];
        __esDecorate(_classThis, null, _getMyBalance_decorators, { kind: "method", name: "getMyBalance", static: false, private: false, access: { has: function (obj) { return "getMyBalance" in obj; }, get: function (obj) { return obj.getMyBalance; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PartnerBalanceController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PartnerBalanceController = _classThis;
}();
exports.PartnerBalanceController = PartnerBalanceController;
