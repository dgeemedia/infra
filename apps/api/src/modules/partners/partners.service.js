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
exports.PartnersService = void 0;
// apps/api/src/modules/partners/partners.service.ts
var common_1 = require("@nestjs/common");
var bcrypt = require("bcryptjs");
var crypto = require("crypto");
var constants_1 = require("@elorge/constants");
// ── Generate a readable temporary password ────────────────────
// Format: El-XXXXX-XXXXX  e.g. "El-Xk3mP-9qRtZ"
function generateTempPassword() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    var bytes = crypto.randomBytes(10);
    var result = 'El-';
    for (var i = 0; i < 5; i++)
        result += chars[bytes[i] % chars.length];
    result += '-';
    for (var i = 5; i < 10; i++)
        result += chars[bytes[i] % chars.length];
    return result;
}
var PartnersService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PartnersService = _classThis = /** @class */ (function () {
        function PartnersService_1(prisma, authService, vanService) {
            this.prisma = prisma;
            this.authService = authService;
            this.vanService = vanService;
            this.logger = new common_1.Logger(PartnersService.name);
        }
        // ── Create partner ────────────────────────────────────────
        PartnersService_1.prototype.create = function (data) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, tempPassword, passwordHash, partner, van, liveKey, sandboxKey;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findUnique({ where: { email: data.email } })];
                        case 1:
                            existing = _b.sent();
                            if (existing) {
                                throw new common_1.ConflictException({
                                    code: constants_1.ERROR_CODES.PARTNER_ALREADY_EXISTS,
                                    message: "A partner with email \"".concat(data.email, "\" already exists."),
                                });
                            }
                            tempPassword = (_a = data.password) !== null && _a !== void 0 ? _a : generateTempPassword();
                            return [4 /*yield*/, bcrypt.hash(tempPassword, 12)];
                        case 2:
                            passwordHash = _b.sent();
                            return [4 /*yield*/, this.prisma.partner.create({
                                    data: {
                                        name: data.name,
                                        email: data.email,
                                        country: data.country,
                                        passwordHash: passwordHash,
                                        mustChangePassword: true,
                                        role: 'PARTNER',
                                        status: 'PENDING_REVIEW',
                                    },
                                })];
                        case 3:
                            partner = _b.sent();
                            return [4 /*yield*/, this.vanService.provisionForPartner({
                                    partnerId: partner.id,
                                    partnerName: data.name,
                                    email: data.email,
                                })];
                        case 4:
                            van = _b.sent();
                            if (van) {
                                this.logger.log("Partner ".concat(partner.id, " VAN: ").concat(van.bankName, " ").concat(van.accountNumber));
                            }
                            else {
                                this.logger.warn("Partner ".concat(partner.id, " VAN provisioning skipped (no FLW key or FLW error)"));
                            }
                            return [4 /*yield*/, this.authService.generateApiKey(partner.id, 'Production Key', 'live')];
                        case 5:
                            liveKey = _b.sent();
                            return [4 /*yield*/, this.authService.generateApiKey(partner.id, 'Sandbox Key', 'sandbox')];
                        case 6:
                            sandboxKey = _b.sent();
                            return [2 /*return*/, {
                                    partner: partner,
                                    tempPassword: tempPassword,
                                    van: van, // null in dev/sandbox if FLW not configured
                                    apiKeys: { live: liveKey, sandbox: sandboxKey },
                                }];
                    }
                });
            });
        };
        PartnersService_1.prototype.changePassword = function (partnerId, currentPassword, newPassword) {
            return __awaiter(this, void 0, void 0, function () {
                var partner, isValid, _a, _b;
                var _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            if (newPassword.length < 8) {
                                throw new common_1.BadRequestException('New password must be at least 8 characters.');
                            }
                            return [4 /*yield*/, this.prisma.partner.findUnique({ where: { id: partnerId } })];
                        case 1:
                            partner = _e.sent();
                            if (!(partner === null || partner === void 0 ? void 0 : partner.passwordHash))
                                throw new common_1.NotFoundException('Partner not found.');
                            return [4 /*yield*/, bcrypt.compare(currentPassword, partner.passwordHash)];
                        case 2:
                            isValid = _e.sent();
                            if (!isValid)
                                throw new common_1.BadRequestException('Current password is incorrect.');
                            if (currentPassword === newPassword) {
                                throw new common_1.BadRequestException('New password must be different from the current one.');
                            }
                            _b = (_a = this.prisma.partner).update;
                            _c = {
                                where: { id: partnerId }
                            };
                            _d = {};
                            return [4 /*yield*/, bcrypt.hash(newPassword, 12)];
                        case 3: return [4 /*yield*/, _b.apply(_a, [(_c.data = (_d.passwordHash = _e.sent(),
                                    _d.mustChangePassword = false,
                                    _d),
                                    _c)])];
                        case 4:
                            _e.sent();
                            return [2 /*return*/, { success: true }];
                    }
                });
            });
        };
        PartnersService_1.prototype.findById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var partner;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findUnique({
                                where: { id: id },
                                include: { apiKeys: { where: { revokedAt: null } } },
                            })];
                        case 1:
                            partner = _a.sent();
                            if (!partner) {
                                throw new common_1.NotFoundException({
                                    code: constants_1.ERROR_CODES.PARTNER_NOT_FOUND,
                                    message: "Partner ".concat(id, " not found."),
                                });
                            }
                            return [2 /*return*/, partner];
                    }
                });
            });
        };
        PartnersService_1.prototype.findAll = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.partner.findMany({ orderBy: { createdAt: 'desc' } })];
                });
            });
        };
        PartnersService_1.prototype.updateStatus = function (id, status) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.partner.update({ where: { id: id }, data: { status: status } })];
                });
            });
        };
        PartnersService_1.prototype.selfSuspend = function (partnerId) {
            return __awaiter(this, void 0, void 0, function () {
                var partner;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findUnique({ where: { id: partnerId } })];
                        case 1:
                            partner = _a.sent();
                            if (!partner)
                                throw new common_1.NotFoundException('Partner not found');
                            if (partner.status === 'SUSPENDED') {
                                throw new common_1.ForbiddenException('Account is already suspended');
                            }
                            return [2 /*return*/, this.prisma.partner.update({
                                    where: { id: partnerId },
                                    data: { status: 'SUSPENDED' },
                                })];
                    }
                });
            });
        };
        PartnersService_1.prototype.generateApiKey = function (partnerId, label, environment) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.authService.generateApiKey(partnerId, label, environment)];
                });
            });
        };
        PartnersService_1.prototype.revokeApiKey = function (keyId, partnerId) {
            return __awaiter(this, void 0, void 0, function () {
                var key;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.apiKey.findFirst({ where: { id: keyId, partnerId: partnerId } })];
                        case 1:
                            key = _a.sent();
                            if (!key)
                                throw new common_1.NotFoundException('API key not found');
                            return [2 /*return*/, this.prisma.apiKey.update({
                                    where: { id: keyId },
                                    data: { revokedAt: new Date() },
                                })];
                    }
                });
            });
        };
        PartnersService_1.prototype.getStats = function (partnerId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, totalPayouts, delivered, failed, todayCount;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.payout.count({ where: { partnerId: partnerId } }),
                                this.prisma.payout.count({ where: { partnerId: partnerId, status: 'DELIVERED' } }),
                                this.prisma.payout.count({ where: { partnerId: partnerId, status: 'FAILED' } }),
                                this.prisma.payout.count({
                                    where: {
                                        partnerId: partnerId,
                                        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                                    },
                                }),
                            ])];
                        case 1:
                            _a = _b.sent(), totalPayouts = _a[0], delivered = _a[1], failed = _a[2], todayCount = _a[3];
                            return [2 /*return*/, {
                                    totalPayouts: totalPayouts,
                                    successfulPayouts: delivered,
                                    failedPayouts: failed,
                                    successRate: totalPayouts > 0 ? Math.round((delivered / totalPayouts) * 100) : 0,
                                    todayPayouts: todayCount,
                                }];
                    }
                });
            });
        };
        return PartnersService_1;
    }());
    __setFunctionName(_classThis, "PartnersService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PartnersService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PartnersService = _classThis;
}();
exports.PartnersService = PartnersService;
