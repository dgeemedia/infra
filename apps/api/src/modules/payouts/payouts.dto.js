// apps/api/src/modules/payouts/payouts.dto.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutQueryDto = exports.CreatePayoutDto = exports.RecipientDto = void 0;
var openapi = require("@nestjs/swagger");
// apps/api/src/modules/payouts/payouts.dto.ts
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
// ── Recipient ─────────────────────────────────────────────────
var RecipientDto = function () {
    var _a;
    var _fullName_decorators;
    var _fullName_initializers = [];
    var _fullName_extraInitializers = [];
    var _bankCode_decorators;
    var _bankCode_initializers = [];
    var _bankCode_extraInitializers = [];
    var _accountNumber_decorators;
    var _accountNumber_initializers = [];
    var _accountNumber_extraInitializers = [];
    var _phone_decorators;
    var _phone_initializers = [];
    var _phone_extraInitializers = [];
    return _a = /** @class */ (function () {
            function RecipientDto() {
                this.fullName = __runInitializers(this, _fullName_initializers, void 0);
                this.bankCode = (__runInitializers(this, _fullName_extraInitializers), __runInitializers(this, _bankCode_initializers, void 0));
                this.accountNumber = (__runInitializers(this, _bankCode_extraInitializers), __runInitializers(this, _accountNumber_initializers, void 0));
                this.phone = (__runInitializers(this, _accountNumber_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
                __runInitializers(this, _phone_extraInitializers);
            }
            RecipientDto._OPENAPI_METADATA_FACTORY = function () {
                return { fullName: { required: true, type: function () { return String; } }, bankCode: { required: true, type: function () { return String; }, pattern: "/^\\d{3,6}$/" }, accountNumber: { required: true, type: function () { return String; }, minLength: 10, maxLength: 10, pattern: "/^\\d{10}$/" }, phone: { required: false, type: function () { return String; }, pattern: "/^\\+234\\d{10}$/" } };
            };
            return RecipientDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _fullName_decorators = [(0, swagger_1.ApiProperty)({ example: 'Chukwuemeka Obi' }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _bankCode_decorators = [(0, swagger_1.ApiProperty)({ example: '058', description: 'CBN bank code (3–6 digits)' }), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^\d{3,6}$/, { message: 'bankCode must be 3–6 digits' })];
            _accountNumber_decorators = [(0, swagger_1.ApiProperty)({ example: '0123456789', description: '10-digit NUBAN' }), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(10, 10, { message: 'accountNumber must be exactly 10 digits' }), (0, class_validator_1.Matches)(/^\d{10}$/, { message: 'accountNumber must contain only digits' })];
            _phone_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '+2348012345678' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Matches)(/^\+234\d{10}$/, { message: 'phone must be +234XXXXXXXXXX' })];
            __esDecorate(null, null, _fullName_decorators, { kind: "field", name: "fullName", static: false, private: false, access: { has: function (obj) { return "fullName" in obj; }, get: function (obj) { return obj.fullName; }, set: function (obj, value) { obj.fullName = value; } }, metadata: _metadata }, _fullName_initializers, _fullName_extraInitializers);
            __esDecorate(null, null, _bankCode_decorators, { kind: "field", name: "bankCode", static: false, private: false, access: { has: function (obj) { return "bankCode" in obj; }, get: function (obj) { return obj.bankCode; }, set: function (obj, value) { obj.bankCode = value; } }, metadata: _metadata }, _bankCode_initializers, _bankCode_extraInitializers);
            __esDecorate(null, null, _accountNumber_decorators, { kind: "field", name: "accountNumber", static: false, private: false, access: { has: function (obj) { return "accountNumber" in obj; }, get: function (obj) { return obj.accountNumber; }, set: function (obj, value) { obj.accountNumber = value; } }, metadata: _metadata }, _accountNumber_initializers, _accountNumber_extraInitializers);
            __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: function (obj) { return "phone" in obj; }, get: function (obj) { return obj.phone; }, set: function (obj, value) { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.RecipientDto = RecipientDto;
// ── Create Payout ─────────────────────────────────────────────
/**
 * Naira-pipe model — partner owns FX entirely
 * ─────────────────────────────────────────────────────────────
 *
 * Partners convert their foreign currency to NGN using their own
 * FX engine and send Elorge the final naira amount in kobo.
 *
 * Elorge:
 *   1. Checks partner's wallet ≥ (nairaAmountKobo + Elorge fee)
 *   2. Debits the full amount from the partner wallet
 *   3. Sends exactly nairaAmountKobo to the recipient via Flutterwave
 *   4. Retains the fee as platform revenue
 *
 * WHY KOBO (INTEGER)?
 *   Integer arithmetic eliminates floating-point rounding errors in
 *   financial calculations. ₦250,000.00 → nairaAmountKobo: 25000000
 *
 * FEES (as of launch):
 *   ≤ ₦50,000     → ₦150  fee
 *   ≤ ₦200,000    → ₦250  fee
 *   ≤ ₦1,000,000  → ₦400  fee
 *   > ₦1,000,000  → ₦600  fee
 *   Flutterwave charges Elorge ~₦27. Elorge profit = fee - ₦27.
 */
var CreatePayoutDto = function () {
    var _a;
    var _partnerReference_decorators;
    var _partnerReference_initializers = [];
    var _partnerReference_extraInitializers = [];
    var _nairaAmountKobo_decorators;
    var _nairaAmountKobo_initializers = [];
    var _nairaAmountKobo_extraInitializers = [];
    var _exchangeRateAudit_decorators;
    var _exchangeRateAudit_initializers = [];
    var _exchangeRateAudit_extraInitializers = [];
    var _recipient_decorators;
    var _recipient_initializers = [];
    var _recipient_extraInitializers = [];
    var _narration_decorators;
    var _narration_initializers = [];
    var _narration_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreatePayoutDto() {
                this.partnerReference = __runInitializers(this, _partnerReference_initializers, void 0);
                this.nairaAmountKobo = (__runInitializers(this, _partnerReference_extraInitializers), __runInitializers(this, _nairaAmountKobo_initializers, void 0));
                this.exchangeRateAudit = (__runInitializers(this, _nairaAmountKobo_extraInitializers), __runInitializers(this, _exchangeRateAudit_initializers, void 0));
                this.recipient = (__runInitializers(this, _exchangeRateAudit_extraInitializers), __runInitializers(this, _recipient_initializers, void 0));
                this.narration = (__runInitializers(this, _recipient_extraInitializers), __runInitializers(this, _narration_initializers, void 0));
                __runInitializers(this, _narration_extraInitializers);
            }
            CreatePayoutDto._OPENAPI_METADATA_FACTORY = function () {
                return { partnerReference: { required: true, type: function () { return String; }, minLength: 1, maxLength: 100 }, nairaAmountKobo: { required: true, type: function () { return Number; }, minimum: 10000, maximum: 5000000000, minimum: 1 }, exchangeRateAudit: { required: false, type: function () { return Number; }, minimum: 1 }, recipient: { required: true, type: function () { return require("./payouts.dto").RecipientDto; } }, narration: { required: false, type: function () { return String; }, minLength: 0, maxLength: 100 } };
            };
            return CreatePayoutDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _partnerReference_decorators = [(0, swagger_1.ApiProperty)({
                    example: 'FP_TXN_20260407_001',
                    description: 'Unique reference per partner. Used as idempotency key. Duplicates are rejected.',
                }), (0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.Length)(1, 100)];
            _nairaAmountKobo_decorators = [(0, swagger_1.ApiProperty)({
                    example: 25000000,
                    description: 'Amount to credit to the Nigerian recipient, in KOBO (1 NGN = 100 kobo). ' +
                        '₦250,000.00 → nairaAmountKobo: 25000000. ' +
                        'Elorge delivers this exact amount. ' +
                        'The platform fee is charged separately from your wallet.',
                }), (0, class_validator_1.IsInt)(), (0, class_validator_1.IsPositive)(), (0, class_validator_1.Min)(10000, { message: 'nairaAmountKobo must be at least ₦100 (10000 kobo)' }), (0, class_validator_1.Max)(5000000000, { message: 'nairaAmountKobo cannot exceed ₦50,000,000 per payout (5000000000 kobo)' }), (0, class_transformer_1.Type)(function () { return Number; })];
            _exchangeRateAudit_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 2050.45,
                    description: 'Your FX rate (optional). Stored for your audit trail and reconciliation. ' +
                        'Elorge never uses this value in any calculation.',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 6 }), (0, class_validator_1.IsPositive)(), (0, class_transformer_1.Type)(function () { return Number; })];
            _recipient_decorators = [(0, swagger_1.ApiProperty)({ type: RecipientDto })];
            _narration_decorators = [(0, swagger_1.ApiPropertyOptional)({
                    example: 'Family support — April 2026',
                    description: 'Description on recipient\'s bank statement (max 100 chars).',
                }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(0, 100)];
            __esDecorate(null, null, _partnerReference_decorators, { kind: "field", name: "partnerReference", static: false, private: false, access: { has: function (obj) { return "partnerReference" in obj; }, get: function (obj) { return obj.partnerReference; }, set: function (obj, value) { obj.partnerReference = value; } }, metadata: _metadata }, _partnerReference_initializers, _partnerReference_extraInitializers);
            __esDecorate(null, null, _nairaAmountKobo_decorators, { kind: "field", name: "nairaAmountKobo", static: false, private: false, access: { has: function (obj) { return "nairaAmountKobo" in obj; }, get: function (obj) { return obj.nairaAmountKobo; }, set: function (obj, value) { obj.nairaAmountKobo = value; } }, metadata: _metadata }, _nairaAmountKobo_initializers, _nairaAmountKobo_extraInitializers);
            __esDecorate(null, null, _exchangeRateAudit_decorators, { kind: "field", name: "exchangeRateAudit", static: false, private: false, access: { has: function (obj) { return "exchangeRateAudit" in obj; }, get: function (obj) { return obj.exchangeRateAudit; }, set: function (obj, value) { obj.exchangeRateAudit = value; } }, metadata: _metadata }, _exchangeRateAudit_initializers, _exchangeRateAudit_extraInitializers);
            __esDecorate(null, null, _recipient_decorators, { kind: "field", name: "recipient", static: false, private: false, access: { has: function (obj) { return "recipient" in obj; }, get: function (obj) { return obj.recipient; }, set: function (obj, value) { obj.recipient = value; } }, metadata: _metadata }, _recipient_initializers, _recipient_extraInitializers);
            __esDecorate(null, null, _narration_decorators, { kind: "field", name: "narration", static: false, private: false, access: { has: function (obj) { return "narration" in obj; }, get: function (obj) { return obj.narration; }, set: function (obj, value) { obj.narration = value; } }, metadata: _metadata }, _narration_initializers, _narration_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreatePayoutDto = CreatePayoutDto;
// ── List Payouts Query ────────────────────────────────────────
var PayoutQueryDto = function () {
    var _a;
    var _page_decorators;
    var _page_initializers = [];
    var _page_extraInitializers = [];
    var _pageSize_decorators;
    var _pageSize_initializers = [];
    var _pageSize_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _startDate_decorators;
    var _startDate_initializers = [];
    var _startDate_extraInitializers = [];
    var _endDate_decorators;
    var _endDate_initializers = [];
    var _endDate_extraInitializers = [];
    var _search_decorators;
    var _search_initializers = [];
    var _search_extraInitializers = [];
    return _a = /** @class */ (function () {
            function PayoutQueryDto() {
                this.page = __runInitializers(this, _page_initializers, 1);
                this.pageSize = (__runInitializers(this, _page_extraInitializers), __runInitializers(this, _pageSize_initializers, 20));
                this.status = (__runInitializers(this, _pageSize_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.startDate = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _startDate_initializers, void 0));
                this.endDate = (__runInitializers(this, _startDate_extraInitializers), __runInitializers(this, _endDate_initializers, void 0));
                this.search = (__runInitializers(this, _endDate_extraInitializers), __runInitializers(this, _search_initializers, void 0));
                __runInitializers(this, _search_extraInitializers);
            }
            PayoutQueryDto._OPENAPI_METADATA_FACTORY = function () {
                return { page: { required: false, type: function () { return Number; }, default: 1, minimum: 1 }, pageSize: { required: false, type: function () { return Number; }, default: 20, minimum: 1, maximum: 500 }, status: { required: false, type: function () { return String; } }, startDate: { required: false, type: function () { return String; } }, endDate: { required: false, type: function () { return String; } }, search: { required: false, type: function () { return String; } } };
            };
            return PayoutQueryDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _page_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 1 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_transformer_1.Type)(function () { return Number; })];
            _pageSize_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 20 }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1), (0, class_validator_1.Max)(500), (0, class_transformer_1.Type)(function () { return Number; })];
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'DELIVERED' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _startDate_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '2026-01-01' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _endDate_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: '2026-12-31' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _search_decorators = [(0, swagger_1.ApiPropertyOptional)({ example: 'FP_TXN' }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _page_decorators, { kind: "field", name: "page", static: false, private: false, access: { has: function (obj) { return "page" in obj; }, get: function (obj) { return obj.page; }, set: function (obj, value) { obj.page = value; } }, metadata: _metadata }, _page_initializers, _page_extraInitializers);
            __esDecorate(null, null, _pageSize_decorators, { kind: "field", name: "pageSize", static: false, private: false, access: { has: function (obj) { return "pageSize" in obj; }, get: function (obj) { return obj.pageSize; }, set: function (obj, value) { obj.pageSize = value; } }, metadata: _metadata }, _pageSize_initializers, _pageSize_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _startDate_decorators, { kind: "field", name: "startDate", static: false, private: false, access: { has: function (obj) { return "startDate" in obj; }, get: function (obj) { return obj.startDate; }, set: function (obj, value) { obj.startDate = value; } }, metadata: _metadata }, _startDate_initializers, _startDate_extraInitializers);
            __esDecorate(null, null, _endDate_decorators, { kind: "field", name: "endDate", static: false, private: false, access: { has: function (obj) { return "endDate" in obj; }, get: function (obj) { return obj.endDate; }, set: function (obj, value) { obj.endDate = value; } }, metadata: _metadata }, _endDate_initializers, _endDate_extraInitializers);
            __esDecorate(null, null, _search_decorators, { kind: "field", name: "search", static: false, private: false, access: { has: function (obj) { return "search" in obj; }, get: function (obj) { return obj.search; }, set: function (obj, value) { obj.search = value; } }, metadata: _metadata }, _search_initializers, _search_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.PayoutQueryDto = PayoutQueryDto;
