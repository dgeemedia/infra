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
exports.BanklyAdapter = void 0;
// apps/api/src/modules/psp/bankly.adapter.ts
var common_1 = require("@nestjs/common");
var axios_1 = require("axios");
var BanklyAdapter = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var BanklyAdapter = _classThis = /** @class */ (function () {
        function BanklyAdapter_1(config) {
            var _this = this;
            var _a;
            this.config = config;
            this.logger = new common_1.Logger(BanklyAdapter.name);
            this.accessToken = null;
            this.tokenExpiresAt = new Date(0);
            var baseUrl = (_a = this.config.get('psp.bankly.baseUrl')) !== null && _a !== void 0 ? _a : 'https://api.bankly.ng';
            this.http = axios_1.default.create({
                baseURL: baseUrl,
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' },
            });
            // Attach auth token to every request
            this.http.interceptors.request.use(function (cfg) { return __awaiter(_this, void 0, void 0, function () {
                var token;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getAccessToken()];
                        case 1:
                            token = _a.sent();
                            cfg.headers['Authorization'] = "Bearer ".concat(token);
                            return [2 /*return*/, cfg];
                    }
                });
            }); });
        }
        // ── Transfer ──────────────────────────────────────────────
        BanklyAdapter_1.prototype.transfer = function (req) {
            return __awaiter(this, void 0, void 0, function () {
                var walletAccount, data, status_1, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            this.logger.log("Initiating transfer: ".concat(req.reference, " \u2192 ").concat(req.bankCode, "/").concat(req.accountNumber));
                            walletAccount = this.config.get('psp.bankly.walletAccount');
                            return [4 /*yield*/, this.http.post('/funds-transfer', {
                                    amount: req.amount,
                                    sourceBankAccount: walletAccount,
                                    destinationBankCode: req.bankCode,
                                    destinationBankAccount: req.accountNumber,
                                    destinationBranchCode: '0001',
                                    destinationAccountName: req.accountName,
                                    description: req.narration,
                                    endToEndId: req.reference, // idempotency key
                                    currency: 'NGN',
                                    paymentType: 'TEF',
                                })];
                        case 1:
                            data = (_a.sent()).data;
                            status_1 = this.mapStatus(data.data.status);
                            return [2 /*return*/, {
                                    success: status_1 !== 'failed',
                                    pspReference: data.data.endToEndId,
                                    status: status_1,
                                    bankSession: data.data.sessionId,
                                    message: data.data.description,
                                }];
                        case 2:
                            error_1 = _a.sent();
                            this.logger.error("Bankly transfer failed: ".concat(req.reference), error_1);
                            return [2 /*return*/, {
                                    success: false,
                                    pspReference: req.reference,
                                    status: 'failed',
                                    message: this.extractErrorMessage(error_1),
                                }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Check Status ──────────────────────────────────────────
        BanklyAdapter_1.prototype.checkStatus = function (pspReference) {
            return __awaiter(this, void 0, void 0, function () {
                var data, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.http.get("/funds-transfer/".concat(pspReference))];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, {
                                    success: data.data.status.toLowerCase() === 'successful',
                                    pspReference: data.data.endToEndId,
                                    status: this.mapStatus(data.data.status),
                                    bankSession: data.data.sessionId,
                                }];
                        case 2:
                            error_2 = _a.sent();
                            this.logger.error("Status check failed for: ".concat(pspReference), error_2);
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
        BanklyAdapter_1.prototype.getBalance = function () {
            return __awaiter(this, void 0, void 0, function () {
                var walletAccount, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            walletAccount = this.config.get('psp.bankly.walletAccount');
                            return [4 /*yield*/, this.http.get("/accounts/".concat(walletAccount, "/balance"))];
                        case 1:
                            data = (_a.sent()).data;
                            return [2 /*return*/, {
                                    available: data.data.availableBalance,
                                    ledger: data.data.currentBalance,
                                    currency: data.data.currency,
                                }];
                    }
                });
            });
        };
        // ── Validate Account (NIP Name Enquiry) ───────────────────
        BanklyAdapter_1.prototype.validateAccount = function (bankCode, accountNumber) {
            return __awaiter(this, void 0, void 0, function () {
                var data, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.http.get("/name-enquiry", { params: { accountNumber: accountNumber, bankCode: bankCode } })];
                        case 1:
                            data = (_b.sent()).data;
                            return [2 /*return*/, {
                                    valid: true,
                                    accountName: data.data.accountName,
                                }];
                        case 2:
                            _a = _b.sent();
                            return [2 /*return*/, { valid: false, accountName: '' }];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Auth token management ─────────────────────────────────
        BanklyAdapter_1.prototype.getAccessToken = function () {
            return __awaiter(this, void 0, void 0, function () {
                var clientId, clientSecret, data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.accessToken && new Date() < this.tokenExpiresAt) {
                                return [2 /*return*/, this.accessToken];
                            }
                            clientId = this.config.get('psp.bankly.clientId');
                            clientSecret = this.config.get('psp.bankly.clientSecret');
                            return [4 /*yield*/, axios_1.default.post('https://identity.bankly.com.ng/connect/token', new URLSearchParams({
                                    grant_type: 'client_credentials',
                                    client_id: clientId !== null && clientId !== void 0 ? clientId : '',
                                    client_secret: clientSecret !== null && clientSecret !== void 0 ? clientSecret : '',
                                }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })];
                        case 1:
                            data = (_a.sent()).data;
                            this.accessToken = data.access_token;
                            this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000 - 60000);
                            return [2 /*return*/, this.accessToken];
                    }
                });
            });
        };
        // ── Helpers ───────────────────────────────────────────────
        BanklyAdapter_1.prototype.mapStatus = function (banklyStatus) {
            var _a;
            var map = {
                successful: 'successful',
                success: 'successful',
                completed: 'successful',
                pending: 'pending',
                inprogress: 'pending',
                failed: 'failed',
                rejected: 'failed',
                reversed: 'reversed',
            };
            return (_a = map[banklyStatus.toLowerCase()]) !== null && _a !== void 0 ? _a : 'failed';
        };
        BanklyAdapter_1.prototype.extractErrorMessage = function (error) {
            var _a, _b, _c;
            if (axios_1.default.isAxiosError(error)) {
                var data = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data;
                return (_c = (_b = data === null || data === void 0 ? void 0 : data['message']) !== null && _b !== void 0 ? _b : data === null || data === void 0 ? void 0 : data['errors']) !== null && _c !== void 0 ? _c : error.message;
            }
            return 'Unknown PSP error';
        };
        return BanklyAdapter_1;
    }());
    __setFunctionName(_classThis, "BanklyAdapter");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BanklyAdapter = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BanklyAdapter = _classThis;
}();
exports.BanklyAdapter = BanklyAdapter;
