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
exports.VanController = void 0;
var openapi = require("@nestjs/swagger");
// apps/api/src/modules/van/van.controller.ts
//
// ── Flutterwave Inbound Webhook Controller ────────────────────
//
// Flutterwave calls this endpoint when NGN lands in a partner VAN.
// This is the "automatic wallet top-up" that makes the system
// fully self-service for partners.
//
// Setup in Flutterwave dashboard:
//   Settings → Webhooks → URL: https://api.elorge.com/v1/webhooks/flutterwave
//   Secret Hash: set FLUTTERWAVE_WEBHOOK_HASH in your .env
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var public_decorator_1 = require("../../common/decorators/public.decorator");
var VanController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Webhooks (Inbound)'), (0, common_1.Controller)('v1/webhooks/flutterwave')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _handleFlutterwaveWebhook_decorators;
    var VanController = _classThis = /** @class */ (function () {
        function VanController_1(vanService) {
            this.vanService = (__runInitializers(this, _instanceExtraInitializers), vanService);
            this.logger = new common_1.Logger(VanController.name);
        }
        /**
         * POST /v1/webhooks/flutterwave
         *
         * Flutterwave sends charge.completed events here when NGN lands
         * in a partner's Virtual Account Number.
         *
         * Must be @Public() — no API key, Flutterwave calls this directly.
         * Security is via the verif-hash header signature check.
         *
         * Flutterwave retries up to 5 times if we return anything other
         * than 200, so we always return 200 even for ignored events.
         */
        VanController_1.prototype.handleFlutterwaveWebhook = function (payload, signature) {
            return __awaiter(this, void 0, void 0, function () {
                var isValid, result;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            isValid = this.vanService.verifySignature(JSON.stringify(payload), signature);
                            if (!isValid) {
                                this.logger.warn("[VAN Webhook] Invalid signature \u2014 possible spoofed request. " +
                                    "Event: ".concat(payload.event));
                                // Return 200 anyway — don't expose that signature failed
                                return [2 /*return*/, { received: true }];
                            }
                            // ── 2. Process the event ────────────────────────────────
                            this.logger.log("[VAN Webhook] Received: ".concat(payload.event, " | ") +
                                "amount: \u20A6".concat((_a = payload.data) === null || _a === void 0 ? void 0 : _a.amount, " | ") +
                                "status: ".concat((_b = payload.data) === null || _b === void 0 ? void 0 : _b.status));
                            return [4 /*yield*/, this.vanService.handleInboundCharge(payload)];
                        case 1:
                            result = _c.sent();
                            if (result) {
                                this.logger.log("[VAN Webhook] Credited ".concat(result.creditedKobo, " kobo to partner ").concat(result.partnerId));
                            }
                            // Always return 200 — Flutterwave will retry if we return anything else
                            return [2 /*return*/, { received: true }];
                    }
                });
            });
        };
        return VanController_1;
    }());
    __setFunctionName(_classThis, "VanController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handleFlutterwaveWebhook_decorators = [(0, common_1.Post)(), (0, public_decorator_1.Public)(), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({
                summary: 'Flutterwave inbound webhook (charge.completed)',
                description: 'Called by Flutterwave when NGN lands in a partner VAN. Automatically credits partner wallet.',
            }), openapi.ApiResponse({ status: common_1.HttpStatus.OK })];
        __esDecorate(_classThis, null, _handleFlutterwaveWebhook_decorators, { kind: "method", name: "handleFlutterwaveWebhook", static: false, private: false, access: { has: function (obj) { return "handleFlutterwaveWebhook" in obj; }, get: function (obj) { return obj.handleFlutterwaveWebhook; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VanController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VanController = _classThis;
}();
exports.VanController = VanController;
