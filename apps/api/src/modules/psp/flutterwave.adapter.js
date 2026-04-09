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
exports.FlutterwaveAdapter = void 0;
// apps/api/src/modules/psp/flutterwave.adapter.ts
var common_1 = require("@nestjs/common");
var axios_1 = require("axios");
var FlutterwaveAdapter = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FlutterwaveAdapter = _classThis = /** @class */ (function () {
        function FlutterwaveAdapter_1(config) {
            var _a, _b;
            this.config = config;
            this.logger = new common_1.Logger(FlutterwaveAdapter.name);
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
        // ── Transfer ──────────────────────────────────────────────
        FlutterwaveAdapter_1.prototype.transfer = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                var data, mapped, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.logger.log("[FLW] Initiating transfer: ".concat(req.reference, " \u2192 ").concat(req.bankCode, "/").concat(req.accountNumber, " \u20A6").concat(req.amount));
                            return [4 /*yield*/, this.http.post('/transfers', {
                                    account_bank: req.bankCode,
                                    account_number: req.accountNumber,
                                    amount: req.amount,
                                    narration: req.narration,
                                    currency: 'NGN',
                                    reference: req.reference, // idempotency key
                                    beneficiary_name: req.accountName,
                                    debit_currency: 'NGN',
                                })];
                        case 1:
                            data = (_a.sent()).data;
                            if (data.status === 'success') {
                                mapped = this.mapStatus(data.data.status);
                                return [2 /*return*/, {
                                        success: mapped !== 'failed',
                                        pspReference: String(data.data.id),
                                        status: mapped,
                                        bankSession: data.data.session_id,
                                        message: data.data.complete_message,
                                    }];
                            }
                            return [2 /*return*/, {
                                    success: false,
                                    pspReference: req.reference,
                                    status: 'failed',
                                    message: data.message,
                                }];
                        case 2:
                            error_1 = _a.sent();
                            this.logger.error("[FLW] Transfer failed: ".concat(req.reference), error_1);
                            return [2 /*return*/, {
                                    success: false,
                                    pspReference: req.reference,
                                    status: 'failed',
                                    message: this.extractError(error_1),
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Check Status ──────────────────────────────────────────
        FlutterwaveAdapter_1.prototype.checkStatus = function (pspReference) {
            return __awaiter(this, void 0, void 0, function () {
                var data, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.http.get("/transfers/".concat(pspReference))];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, {
                                    success: data.data.status === 'SUCCESSFUL',
                                    pspReference: String(data.data.id),
                                    status: this.mapStatus(data.data.status),
                                    message: data.data.complete_message,
                                }];
                        case 2:
                            error_2 = _a.sent();
                            this.logger.error("[FLW] Status check failed: ".concat(pspReference), error_2);
                            return [2 /*return*/, {
                                    success: false,
                                    pspReference: pspReference,
                                    status: 'failed',
                                    message: 'Status check failed',
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Get Balance ───────────────────────────────────────────
        FlutterwaveAdapter_1.prototype.getBalance = function () {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.http.get('/balances/NGN')];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, {
                                    available: data.data.available_balance,
                                    ledger: data.data.ledger_balance,
                                    currency: data.data.currency,
                                }];
                    }
                });
            });
        };
        // ── Validate Account (NIBSS Name Enquiry) ─────────────────
        FlutterwaveAdapter_1.prototype.validateAccount = function (bankCode, accountNumber) {
            return __awaiter(this, void 0, void 0, function () {
                var data, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.http.post('/accounts/resolve', { account_number: accountNumber, account_bank: bankCode })];
                        case 1:
                            data = (_b.sent()).data;
                            if (data.status === 'success') {
                                return [2 /*return*/, { valid: true, accountName: data.data.account_name }];
                            }
                            return [2 /*return*/, { valid: false, accountName: '' }];
                        case 2:
                            _a = _b.sent();
                            return [2 /*return*/, { valid: false, accountName: '' }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Helpers ───────────────────────────────────────────────
        FlutterwaveAdapter_1.prototype.mapStatus = function (flwStatus) {
            var _a;
            var map = {
                'SUCCESSFUL': 'successful',
                'SUCCESS': 'successful',
                'NEW': 'pending',
                'PENDING': 'pending',
                'PROCESSING': 'pending',
                'FAILED': 'failed',
                'REVERSED': 'reversed',
            };
            return (_a = map[flwStatus.toUpperCase()]) !== null && _a !== void 0 ? _a : 'failed';
        };
        FlutterwaveAdapter_1.prototype.extractError = function (error) {
            var _a, _b;
            if (axios_1.default.isAxiosError(error)) {
                var d = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data;
                return (_b = d === null || d === void 0 ? void 0 : d['message']) !== null && _b !== void 0 ? _b : error.message;
            }
            return 'Unknown Flutterwave error';
        };
        return FlutterwaveAdapter_1;
    }());
    __setFunctionName(_classThis, "FlutterwaveAdapter");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FlutterwaveAdapter = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FlutterwaveAdapter = _classThis;
}();
exports.FlutterwaveAdapter = FlutterwaveAdapter;
