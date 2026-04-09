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
exports.AuthService = void 0;
// apps/api/src/modules/auth/auth.service.ts
var common_1 = require("@nestjs/common");
var bcrypt = require("bcryptjs");
var uuid_1 = require("uuid");
var AuthService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AuthService = _classThis = /** @class */ (function () {
        function AuthService_1(prisma, jwtService, configService) {
            this.prisma = prisma;
            this.jwtService = jwtService;
            this.configService = configService;
            this.logger = new common_1.Logger(AuthService.name);
        }
        // ── Validate raw API key ──────────────────────────────────
        AuthService_1.prototype.validateApiKey = function (rawKey) {
            return __awaiter(this, void 0, void 0, function () {
                var candidates, _i, candidates_1, apiKey, isMatch, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 6, , 7]);
                            return [4 /*yield*/, this.prisma.apiKey.findMany({
                                    where: { revokedAt: null, keyPreview: { startsWith: rawKey.substring(0, 12) } },
                                    include: { partner: true },
                                })];
                        case 1:
                            candidates = _a.sent();
                            _i = 0, candidates_1 = candidates;
                            _a.label = 2;
                        case 2:
                            if (!(_i < candidates_1.length)) return [3 /*break*/, 5];
                            apiKey = candidates_1[_i];
                            return [4 /*yield*/, bcrypt.compare(rawKey, apiKey.keyHash)];
                        case 3:
                            isMatch = _a.sent();
                            if (isMatch) {
                                if (apiKey.partner.status !== 'ACTIVE') {
                                    this.logger.warn("Suspended partner attempted access: ".concat(apiKey.partnerId));
                                    return [2 /*return*/, null];
                                }
                                void this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
                                return [2 /*return*/, {
                                        id: apiKey.partner.id,
                                        name: apiKey.partner.name,
                                        email: apiKey.partner.email,
                                        country: apiKey.partner.country,
                                        status: apiKey.partner.status,
                                        apiKeyId: apiKey.id,
                                        environment: apiKey.environment,
                                    }];
                            }
                            _a.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/, null];
                        case 6:
                            error_1 = _a.sent();
                            this.logger.error('API key validation error', error_1);
                            return [2 /*return*/, null];
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Validate dashboard JWT ────────────────────────────────
        AuthService_1.prototype.validateJwtToken = function (token) {
            return __awaiter(this, void 0, void 0, function () {
                var payload, partner, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            payload = this.jwtService.verify(token, { secret: this.configService.get('app.jwtSecret') });
                            return [4 /*yield*/, this.prisma.partner.findUnique({ where: { id: payload.sub } })];
                        case 1:
                            partner = _a.sent();
                            // Allow PENDING_REVIEW partners through so they can change their password
                            // The dashboard layout handles the redirect to /change-password
                            if (!partner || partner.status === 'SUSPENDED') {
                                this.logger.warn("JWT auth: partner not found or suspended: ".concat(payload.sub));
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, {
                                    id: partner.id,
                                    name: partner.name,
                                    email: partner.email,
                                    country: partner.country,
                                    status: partner.status,
                                    apiKeyId: 'dashboard-session',
                                    environment: 'live',
                                }];
                        case 2:
                            error_2 = _a.sent();
                            this.logger.warn('JWT token validation failed:', error_2);
                            return [2 /*return*/, null];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Generate API key ──────────────────────────────────────
        AuthService_1.prototype.generateApiKey = function (partnerId, label, environment) {
            return __awaiter(this, void 0, void 0, function () {
                var prefix, rawKey, keyHash, preview, apiKey;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            prefix = environment === 'live'
                                ? ((_a = this.configService.get('app.apiKeyPrefix')) !== null && _a !== void 0 ? _a : 'el_live_')
                                : ((_b = this.configService.get('app.apiKeySandboxPrefix')) !== null && _b !== void 0 ? _b : 'el_test_');
                            rawKey = "".concat(prefix).concat((0, uuid_1.v4)().replace(/-/g, ''));
                            return [4 /*yield*/, bcrypt.hash(rawKey, 12)];
                        case 1:
                            keyHash = _c.sent();
                            preview = "".concat(rawKey.substring(0, 16), "...").concat(rawKey.slice(-4));
                            return [4 /*yield*/, this.prisma.apiKey.create({
                                    data: { partnerId: partnerId, label: label, keyHash: keyHash, keyPreview: preview, environment: environment },
                                })];
                        case 2:
                            apiKey = _c.sent();
                            return [2 /*return*/, { fullKey: rawKey, preview: preview, id: apiKey.id }];
                    }
                });
            });
        };
        // ── Dashboard login ────────────────────────────────────────
        // mustChangePassword is included in the JWT so the dashboard
        // can redirect to /change-password without an extra API call.
        AuthService_1.prototype.loginDashboard = function (email, password) {
            return __awaiter(this, void 0, void 0, function () {
                var partner, isValid, token, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, this.prisma.partner.findUnique({ where: { email: email } })];
                        case 1:
                            partner = _a.sent();
                            if (!partner) {
                                this.logger.warn("Login attempt for unknown email: ".concat(email));
                                return [2 /*return*/, null];
                            }
                            // Suspended partners cannot log in
                            if (partner.status === 'SUSPENDED') {
                                this.logger.warn("Suspended partner attempted login: ".concat(email));
                                return [2 /*return*/, null];
                            }
                            // PENDING_REVIEW partners CAN log in — they need to change their password
                            // The dashboard will redirect them to /change-password
                            if (!partner.passwordHash) {
                                this.logger.warn("Partner has no password set: ".concat(email));
                                return [2 /*return*/, null];
                            }
                            return [4 /*yield*/, bcrypt.compare(password, partner.passwordHash)];
                        case 2:
                            isValid = _a.sent();
                            if (!isValid) {
                                this.logger.warn("Invalid password for: ".concat(email));
                                return [2 /*return*/, null];
                            }
                            token = this.jwtService.sign({
                                sub: partner.id,
                                email: partner.email,
                                name: partner.name,
                                role: partner.role,
                                mustChangePassword: partner.mustChangePassword, // ← included in token
                            });
                            return [2 /*return*/, { accessToken: token }];
                        case 3:
                            error_3 = _a.sent();
                            this.logger.error('Dashboard login error', error_3);
                            return [2 /*return*/, null];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return AuthService_1;
    }());
    __setFunctionName(_classThis, "AuthService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthService = _classThis;
}();
exports.AuthService = AuthService;
