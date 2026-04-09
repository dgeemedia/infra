"use strict";
// apps/api/src/modules/van/van.service.ts
//
// ── Virtual Account Number (VAN) Service ─────────────────────
//
// Every partner gets a unique Flutterwave Payout Subaccount (PSA).
// This gives them a Nigerian bank account number they can wire NGN to.
// When NGN hits the VAN, Flutterwave fires a webhook → we credit
// their balanceKobo automatically.
//
// Partner dashboard shows:
//   Bank:    Wema Bank PLC (or Flutterwave's assigned bank)
//   Account: 7353333250
//   Ref:     ELORGE-FINESTPAY-001
//
// Partners can set up automatic transfers from their own system
// without any manual intervention from Elorge.
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
exports.VanService = void 0;
var common_1 = require("@nestjs/common");
var axios_1 = require("axios");
var VanService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var VanService = _classThis = /** @class */ (function () {
        function VanService_1(config, prisma) {
            var _a, _b;
            this.config = config;
            this.prisma = prisma;
            this.logger = new common_1.Logger(VanService.name);
            var secretKey = (_a = this.config.get('psp.flutterwave.secretKey')) !== null && _a !== void 0 ? _a : '';
            var baseUrl = (_b = this.config.get('psp.flutterwave.baseUrl')) !== null && _b !== void 0 ? _b : 'https://api.flutterwave.com/v3';
            this.http = axios_1.default.create({
                baseURL: baseUrl,
                timeout: 30000,
                headers: {
                    'Authorization': "Bearer ".concat(secretKey),
                    'Content-Type': 'application/json',
                },
            });
        }
        // ── Provision a VAN for a new partner ─────────────────────
        //
        // Called once during partner creation.
        // Stores the VAN details on the Partner record.
        // Returns the account number and bank for display.
        VanService_1.prototype.provisionForPartner = function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var secretKey, reference, data, van, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            secretKey = this.config.get('psp.flutterwave.secretKey');
                            if (!secretKey) {
                                this.logger.warn('[VAN] FLUTTERWAVE_SECRET_KEY not set — skipping VAN provisioning');
                                return [2 /*return*/, null];
                            }
                            reference = "ELORGE-".concat(params.partnerId.substring(0, 8).toUpperCase());
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, this.http.post('/payout-subaccounts', {
                                    account_name: params.partnerName,
                                    email: params.email,
                                    mobilenumber: '08000000000', // placeholder — FLW requires this field
                                    country: 'NG',
                                    account_reference: reference,
                                })];
                        case 2:
                            data = (_a.sent()).data;
                            if (data.status !== 'success') {
                                this.logger.error('[VAN] Failed to create PSA', data.message);
                                return [2 /*return*/, null];
                            }
                            van = data.data;
                            // Persist to DB
                            return [4 /*yield*/, this.prisma.partner.update({
                                    where: { id: params.partnerId },
                                    data: {
                                        flwVanAccountNumber: van.nuban,
                                        flwVanBankName: van.bank_name,
                                        flwVanBankCode: van.bank_code,
                                        flwVanReference: reference,
                                        flwVanCreatedAt: new Date(),
                                    },
                                })];
                        case 3:
                            // Persist to DB
                            _a.sent();
                            this.logger.log("[VAN] Provisioned for partner ".concat(params.partnerId, ": ") +
                                "".concat(van.bank_name, " ").concat(van.nuban, " (ref: ").concat(reference, ")"));
                            return [2 /*return*/, {
                                    accountNumber: van.nuban,
                                    bankName: van.bank_name,
                                    bankCode: van.bank_code,
                                    reference: reference,
                                }];
                        case 4:
                            error_1 = _a.sent();
                            this.logger.error('[VAN] Error provisioning VAN', error_1);
                            return [2 /*return*/, null];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Verify Flutterwave webhook signature ──────────────────
        //
        // Flutterwave signs webhooks with your secret hash.
        // Set FLUTTERWAVE_WEBHOOK_HASH in .env to the value you configure
        // in Flutterwave's dashboard → Settings → Webhooks → Secret Hash.
        VanService_1.prototype.verifySignature = function (payload, signature) {
            var secretHash = this.config.get('psp.flutterwave.webhookHash');
            if (!secretHash) {
                this.logger.warn('[VAN] FLUTTERWAVE_WEBHOOK_HASH not set — skipping signature verification');
                return true; // allow in dev; block in prod via env
            }
            return signature === secretHash;
        };
        // ── Handle inbound charge.completed webhook ───────────────
        //
        // Called when NGN lands in any of our partner VANs.
        // Matches the VAN reference to a partner and credits their balance.
        //
        // Returns the credited amount or null if ignored.
        VanService_1.prototype.handleInboundCharge = function (payload) {
            return __awaiter(this, void 0, void 0, function () {
                var reference, partner, nairaAmount, creditedKobo, flwRef, alreadyProcessed, newBalance, payoutsAdded;
                var _a, _b, _c;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            // Only process successful NGN bank transfer credits
                            if (payload.event !== 'charge.completed')
                                return [2 /*return*/, null];
                            if (payload.data.status !== 'successful')
                                return [2 /*return*/, null];
                            if (payload.data.currency !== 'NGN')
                                return [2 /*return*/, null];
                            reference = (_a = payload.account_reference) !== null && _a !== void 0 ? _a : (_b = payload.data.meta) === null || _b === void 0 ? void 0 : _b.account_reference;
                            if (!reference) {
                                this.logger.warn('[VAN] Webhook received without account_reference', payload.data);
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, this.prisma.partner.findFirst({
                                    where: { flwVanReference: reference },
                                    select: { id: true, name: true, balanceKobo: true },
                                })];
                        case 1:
                            partner = _d.sent();
                            if (!partner) {
                                this.logger.warn("[VAN] No partner found for reference: ".concat(reference));
                                return [2 /*return*/, null];
                            }
                            nairaAmount = payload.data.amount;
                            creditedKobo = Math.round(nairaAmount * 100);
                            if (creditedKobo <= 0)
                                return [2 /*return*/, null];
                            flwRef = String(payload.data.id);
                            return [4 /*yield*/, this.prisma.balanceTransaction.findFirst({
                                    where: { description: { contains: flwRef } },
                                })];
                        case 2:
                            alreadyProcessed = _d.sent();
                            if (alreadyProcessed) {
                                this.logger.warn("[VAN] Duplicate webhook for FLW ID ".concat(flwRef, " \u2014 ignoring"));
                                return [2 /*return*/, null];
                            }
                            newBalance = partner.balanceKobo + creditedKobo;
                            // Credit balance + create ledger entry — atomically
                            return [4 /*yield*/, this.prisma.$transaction([
                                    this.prisma.partner.update({
                                        where: { id: partner.id },
                                        data: { balanceKobo: { increment: creditedKobo } },
                                    }),
                                    this.prisma.balanceTransaction.create({
                                        data: {
                                            partnerId: partner.id,
                                            type: 'CREDIT',
                                            amountKobo: creditedKobo,
                                            balanceAfterKobo: newBalance,
                                            description: "VAN deposit \u2014 FLW ID ".concat(flwRef, " \u2014 \u20A6").concat(nairaAmount.toLocaleString('en-NG')),
                                        },
                                    }),
                                ])];
                        case 3:
                            // Credit balance + create ledger entry — atomically
                            _d.sent();
                            payoutsAdded = Math.floor(creditedKobo / ((_c = this.config.get('app.platformFeeKobo')) !== null && _c !== void 0 ? _c : 50000));
                            return [4 /*yield*/, this.prisma.notification.create({
                                    data: {
                                        partnerId: partner.id,
                                        type: 'BALANCE_CREDITED',
                                        title: "Balance funded \u2014 \u20A6".concat(nairaAmount.toLocaleString('en-NG')),
                                        body: "\u20A6".concat(nairaAmount.toLocaleString('en-NG'), " has been credited to your Elorge wallet. ") +
                                            "You now have approximately ".concat(payoutsAdded.toLocaleString(), " additional payouts available."),
                                        read: false,
                                        metadata: {
                                            flwRef: flwRef,
                                            nairaAmount: nairaAmount,
                                            creditedKobo: creditedKobo,
                                            newBalanceKobo: newBalance,
                                        },
                                    },
                                })];
                        case 4:
                            _d.sent();
                            this.logger.log("[VAN] Credited ".concat(creditedKobo, " kobo (\u20A6").concat(nairaAmount, ") to partner ").concat(partner.id, " ") +
                                "(".concat(partner.name, ") \u2014 new balance: ").concat(newBalance, " kobo"));
                            return [2 /*return*/, { partnerId: partner.id, creditedKobo: creditedKobo }];
                    }
                });
            });
        };
        return VanService_1;
    }());
    __setFunctionName(_classThis, "VanService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VanService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VanService = _classThis;
}();
exports.VanService = VanService;
