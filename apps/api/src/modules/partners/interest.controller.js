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
exports.InterestController = void 0;
var openapi = require("@nestjs/swagger");
// apps/api/src/modules/partners/interest.controller.ts
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var public_decorator_1 = require("../../common/decorators/public.decorator");
var ExpressionOfInterestDto = function () {
    var _a;
    var _companyName_decorators;
    var _companyName_initializers = [];
    var _companyName_extraInitializers = [];
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _country_decorators;
    var _country_initializers = [];
    var _country_extraInitializers = [];
    var _message_decorators;
    var _message_initializers = [];
    var _message_extraInitializers = [];
    var _website_decorators;
    var _website_initializers = [];
    var _website_extraInitializers = [];
    var _estimatedVolume_decorators;
    var _estimatedVolume_initializers = [];
    var _estimatedVolume_extraInitializers = [];
    return _a = /** @class */ (function () {
            function ExpressionOfInterestDto() {
                this.companyName = __runInitializers(this, _companyName_initializers, void 0);
                this.email = (__runInitializers(this, _companyName_extraInitializers), __runInitializers(this, _email_initializers, void 0));
                this.country = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _country_initializers, void 0));
                this.message = (__runInitializers(this, _country_extraInitializers), __runInitializers(this, _message_initializers, void 0));
                this.website = (__runInitializers(this, _message_extraInitializers), __runInitializers(this, _website_initializers, void 0));
                this.estimatedVolume = (__runInitializers(this, _website_extraInitializers), __runInitializers(this, _estimatedVolume_initializers, void 0)); // e.g. "£10k–£50k/month"
                __runInitializers(this, _estimatedVolume_extraInitializers);
            }
            return ExpressionOfInterestDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _companyName_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.Length)(2, 100)];
            _email_decorators = [(0, class_validator_1.IsEmail)()];
            _country_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.Length)(2, 2)];
            _message_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.Length)(0, 500)];
            _website_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsUrl)()];
            _estimatedVolume_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _companyName_decorators, { kind: "field", name: "companyName", static: false, private: false, access: { has: function (obj) { return "companyName" in obj; }, get: function (obj) { return obj.companyName; }, set: function (obj, value) { obj.companyName = value; } }, metadata: _metadata }, _companyName_initializers, _companyName_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _country_decorators, { kind: "field", name: "country", static: false, private: false, access: { has: function (obj) { return "country" in obj; }, get: function (obj) { return obj.country; }, set: function (obj, value) { obj.country = value; } }, metadata: _metadata }, _country_initializers, _country_extraInitializers);
            __esDecorate(null, null, _message_decorators, { kind: "field", name: "message", static: false, private: false, access: { has: function (obj) { return "message" in obj; }, get: function (obj) { return obj.message; }, set: function (obj, value) { obj.message = value; } }, metadata: _metadata }, _message_initializers, _message_extraInitializers);
            __esDecorate(null, null, _website_decorators, { kind: "field", name: "website", static: false, private: false, access: { has: function (obj) { return "website" in obj; }, get: function (obj) { return obj.website; }, set: function (obj, value) { obj.website = value; } }, metadata: _metadata }, _website_initializers, _website_extraInitializers);
            __esDecorate(null, null, _estimatedVolume_decorators, { kind: "field", name: "estimatedVolume", static: false, private: false, access: { has: function (obj) { return "estimatedVolume" in obj; }, get: function (obj) { return obj.estimatedVolume; }, set: function (obj, value) { obj.estimatedVolume = value; } }, metadata: _metadata }, _estimatedVolume_initializers, _estimatedVolume_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
var InterestController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Public'), (0, common_1.Controller)('v1/interest')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _submit_decorators;
    var InterestController = _classThis = /** @class */ (function () {
        function InterestController_1(prisma) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
        }
        // POST /v1/interest — completely public, no auth
        InterestController_1.prototype.submit = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var admin;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.partner.findFirst({
                                where: { role: 'ADMIN' },
                                orderBy: { createdAt: 'asc' },
                            })];
                        case 1:
                            admin = _a.sent();
                            if (!admin) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.prisma.notification.create({
                                    data: {
                                        partnerId: admin.id,
                                        type: 'SYSTEM',
                                        title: "New Partner Interest: ".concat(dto.companyName),
                                        body: "".concat(dto.companyName, " (").concat(dto.email, ", ").concat(dto.country, ") has expressed interest in joining Elorge.").concat(dto.estimatedVolume ? " Estimated volume: ".concat(dto.estimatedVolume, ".") : '').concat(dto.message ? " Message: \"".concat(dto.message, "\"") : ''),
                                        read: false,
                                        metadata: {
                                            companyName: dto.companyName,
                                            email: dto.email,
                                            country: dto.country,
                                            website: dto.website,
                                            estimatedVolume: dto.estimatedVolume,
                                            message: dto.message,
                                            submittedAt: new Date().toISOString(),
                                        },
                                    },
                                })];
                        case 2:
                            _a.sent();
                            _a.label = 3;
                        case 3: 
                        // Return success regardless — don't leak whether admin exists
                        return [2 /*return*/, {
                                success: true,
                                message: 'Thank you for your interest. Our team will be in touch within 2 business days.',
                            }];
                    }
                });
            });
        };
        return InterestController_1;
    }());
    __setFunctionName(_classThis, "InterestController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _submit_decorators = [(0, common_1.Post)(), (0, public_decorator_1.Public)(), (0, common_1.HttpCode)(common_1.HttpStatus.CREATED), (0, swagger_1.ApiOperation)({
                summary: 'Submit expression of interest',
                description: 'Public endpoint — prospective partners submit their details. Admin is notified via a SYSTEM notification.',
            }), openapi.ApiResponse({ status: common_1.HttpStatus.CREATED })];
        __esDecorate(_classThis, null, _submit_decorators, { kind: "method", name: "submit", static: false, private: false, access: { has: function (obj) { return "submit" in obj; }, get: function (obj) { return obj.submit; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        InterestController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return InterestController = _classThis;
}();
exports.InterestController = InterestController;
