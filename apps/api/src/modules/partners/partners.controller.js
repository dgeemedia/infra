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
exports.PartnersController = void 0;
var openapi = require("@nestjs/swagger");
// apps/api/src/modules/partners/partners.controller.ts
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var public_decorator_1 = require("../../common/decorators/public.decorator");
// ── DTOs ──────────────────────────────────────────────────────
var CreatePartnerDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _country_decorators;
    var _country_initializers = [];
    var _country_extraInitializers = [];
    var _password_decorators;
    var _password_initializers = [];
    var _password_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreatePartnerDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.email = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _email_initializers, void 0));
                this.country = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _country_initializers, void 0));
                // Optional — if absent the service auto-generates a secure temp password
                this.password = (__runInitializers(this, _country_extraInitializers), __runInitializers(this, _password_initializers, void 0));
                __runInitializers(this, _password_extraInitializers);
            }
            return CreatePartnerDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.Length)(2, 100)];
            _email_decorators = [(0, class_validator_1.IsEmail)()];
            _country_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.Length)(2, 2)];
            _password_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(8)];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _country_decorators, { kind: "field", name: "country", static: false, private: false, access: { has: function (obj) { return "country" in obj; }, get: function (obj) { return obj.country; }, set: function (obj, value) { obj.country = value; } }, metadata: _metadata }, _country_initializers, _country_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: function (obj) { return "password" in obj; }, get: function (obj) { return obj.password; }, set: function (obj, value) { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var GenerateKeyDto = function () {
    var _a;
    var _label_decorators;
    var _label_initializers = [];
    var _label_extraInitializers = [];
    var _environment_decorators;
    var _environment_initializers = [];
    var _environment_extraInitializers = [];
    return _a = /** @class */ (function () {
            function GenerateKeyDto() {
                this.label = __runInitializers(this, _label_initializers, void 0);
                this.environment = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _environment_initializers, void 0));
                __runInitializers(this, _environment_extraInitializers);
            }
            return GenerateKeyDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _label_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.Length)(2, 50)];
            _environment_decorators = [(0, class_validator_1.IsIn)(['live', 'sandbox'])];
            __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: function (obj) { return "label" in obj; }, get: function (obj) { return obj.label; }, set: function (obj, value) { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
            __esDecorate(null, null, _environment_decorators, { kind: "field", name: "environment", static: false, private: false, access: { has: function (obj) { return "environment" in obj; }, get: function (obj) { return obj.environment; }, set: function (obj, value) { obj.environment = value; } }, metadata: _metadata }, _environment_initializers, _environment_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var ChangePasswordDto = function () {
    var _a;
    var _currentPassword_decorators;
    var _currentPassword_initializers = [];
    var _currentPassword_extraInitializers = [];
    var _newPassword_decorators;
    var _newPassword_initializers = [];
    var _newPassword_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ChangePasswordDto() {
                this.currentPassword = __runInitializers(this, _currentPassword_initializers, void 0);
                this.newPassword = (__runInitializers(this, _currentPassword_extraInitializers), __runInitializers(this, _newPassword_initializers, void 0));
                __runInitializers(this, _newPassword_extraInitializers);
            }
            return ChangePasswordDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _currentPassword_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(1)];
            _newPassword_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(8)];
            __esDecorate(null, null, _currentPassword_decorators, { kind: "field", name: "currentPassword", static: false, private: false, access: { has: function (obj) { return "currentPassword" in obj; }, get: function (obj) { return obj.currentPassword; }, set: function (obj, value) { obj.currentPassword = value; } }, metadata: _metadata }, _currentPassword_initializers, _currentPassword_extraInitializers);
            __esDecorate(null, null, _newPassword_decorators, { kind: "field", name: "newPassword", static: false, private: false, access: { has: function (obj) { return "newPassword" in obj; }, get: function (obj) { return obj.newPassword; }, set: function (obj, value) { obj.newPassword = value; } }, metadata: _metadata }, _newPassword_initializers, _newPassword_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
// ── Controller ────────────────────────────────────────────────
var PartnersController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Partners'), (0, common_1.Controller)('v1/partners')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _create_decorators;
    var _findAll_decorators;
    var _findOne_decorators;
    var _getStats_decorators;
    var _generateKey_decorators;
    var _revokeKey_decorators;
    var _selfSuspend_decorators;
    var _changePassword_decorators;
    var PartnersController = _classThis = /** @class */ (function () {
        function PartnersController_1(partnersService) {
            this.partnersService = (__runInitializers(this, _instanceExtraInitializers), partnersService);
        }
        PartnersController_1.prototype.create = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.partnersService.create(dto)];
                });
            });
        };
        PartnersController_1.prototype.findAll = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.partnersService.findAll()];
                });
            });
        };
        PartnersController_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.partnersService.findById(id)];
                });
            });
        };
        PartnersController_1.prototype.getStats = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.partnersService.getStats(id)];
                });
            });
        };
        PartnersController_1.prototype.generateKey = function (id, dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.partnersService.generateApiKey(id, dto.label, dto.environment)];
                });
            });
        };
        PartnersController_1.prototype.revokeKey = function (id, keyId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.partnersService.revokeApiKey(keyId, id)];
                });
            });
        };
        // ── Self-suspend ──────────────────────────────────────────
        PartnersController_1.prototype.selfSuspend = function (partner) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.partnersService.selfSuspend(partner.id)];
                });
            });
        };
        // ── Change password ───────────────────────────────────────
        // Called by the partner to set their own password.
        // Verifies the current (temp) password first, then clears mustChangePassword.
        PartnersController_1.prototype.changePassword = function (partner, dto) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.partnersService.changePassword(partner.id, dto.currentPassword, dto.newPassword)];
                });
            });
        };
        return PartnersController_1;
    }());
    __setFunctionName(_classThis, "PartnersController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _create_decorators = [(0, common_1.Post)(), (0, public_decorator_1.Public)(), (0, swagger_1.ApiOperation)({ summary: 'Create a new partner (admin)' }), openapi.ApiResponse({ status: 201 })];
        _findAll_decorators = [(0, common_1.Get)(), (0, public_decorator_1.Public)(), (0, swagger_1.ApiOperation)({ summary: 'List all partners' }), openapi.ApiResponse({ status: 200 })];
        _findOne_decorators = [(0, common_1.Get)(':id'), (0, public_decorator_1.Public)(), (0, swagger_1.ApiOperation)({ summary: 'Get partner by ID' }), openapi.ApiResponse({ status: 200, type: Object })];
        _getStats_decorators = [(0, common_1.Get)(':id/stats'), (0, public_decorator_1.Public)(), (0, swagger_1.ApiOperation)({ summary: 'Get partner payout stats' }), openapi.ApiResponse({ status: 200 })];
        _generateKey_decorators = [(0, common_1.Post)(':id/api-keys'), (0, public_decorator_1.Public)(), (0, swagger_1.ApiOperation)({ summary: 'Generate a new API key for a partner' }), openapi.ApiResponse({ status: 201 })];
        _revokeKey_decorators = [(0, common_1.Patch)(':id/api-keys/:keyId/revoke'), (0, public_decorator_1.Public)(), (0, swagger_1.ApiOperation)({ summary: 'Revoke an API key' }), openapi.ApiResponse({ status: 200 })];
        _selfSuspend_decorators = [(0, common_1.Patch)('me/suspend'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Partner suspends their own account' }), openapi.ApiResponse({ status: common_1.HttpStatus.OK })];
        _changePassword_decorators = [(0, common_1.Patch)('me/password'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'Partner changes their own password' }), openapi.ApiResponse({ status: common_1.HttpStatus.OK })];
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findAll_decorators, { kind: "method", name: "findAll", static: false, private: false, access: { has: function (obj) { return "findAll" in obj; }, get: function (obj) { return obj.findAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _findOne_decorators, { kind: "method", name: "findOne", static: false, private: false, access: { has: function (obj) { return "findOne" in obj; }, get: function (obj) { return obj.findOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getStats_decorators, { kind: "method", name: "getStats", static: false, private: false, access: { has: function (obj) { return "getStats" in obj; }, get: function (obj) { return obj.getStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _generateKey_decorators, { kind: "method", name: "generateKey", static: false, private: false, access: { has: function (obj) { return "generateKey" in obj; }, get: function (obj) { return obj.generateKey; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _revokeKey_decorators, { kind: "method", name: "revokeKey", static: false, private: false, access: { has: function (obj) { return "revokeKey" in obj; }, get: function (obj) { return obj.revokeKey; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _selfSuspend_decorators, { kind: "method", name: "selfSuspend", static: false, private: false, access: { has: function (obj) { return "selfSuspend" in obj; }, get: function (obj) { return obj.selfSuspend; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _changePassword_decorators, { kind: "method", name: "changePassword", static: false, private: false, access: { has: function (obj) { return "changePassword" in obj; }, get: function (obj) { return obj.changePassword; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PartnersController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PartnersController = _classThis;
}();
exports.PartnersController = PartnersController;
