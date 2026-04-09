"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
exports.WebhooksService = void 0;
// apps/api/src/modules/webhooks/webhooks.service.ts
var common_1 = require("@nestjs/common");
var axios_1 = require("axios");
var crypto = require("crypto");
var uuid_1 = require("uuid");
var WebhooksService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var WebhooksService = _classThis = /** @class */ (function () {
        function WebhooksService_1(prisma, config, notifications) {
            this.prisma = prisma;
            this.config = config;
            this.notifications = notifications;
            this.logger = new common_1.Logger(WebhooksService.name);
        }
        // ── Fire a payout lifecycle event to all partner webhooks ─────────
        WebhooksService_1.prototype.firePayoutEvent = function (payoutId, event) {
            return __awaiter(this, void 0, void 0, function () {
                var payout, notifMap, notif, typeMap, webhooks;
                var _this = this;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, this.prisma.payout.findUnique({
                                where: { id: payoutId },
                                include: { recipient: true },
                            })];
                        case 1:
                            payout = _b.sent();
                            if (!payout)
                                return [2 /*return*/];
                            notifMap = {
                                'payout.delivered': {
                                    title: 'Payout Delivered',
                                    body: "".concat(payout.partnerReference, " was successfully credited to the recipient."),
                                },
                                'payout.failed': {
                                    title: 'Payout Failed',
                                    body: "".concat(payout.partnerReference, " failed after all retries. ").concat((_a = payout.failureReason) !== null && _a !== void 0 ? _a : '').trim(),
                                },
                                'payout.flagged': {
                                    title: 'Payout Flagged',
                                    body: "".concat(payout.partnerReference, " is on hold pending compliance review."),
                                },
                                'payout.processing': null,
                            };
                            notif = notifMap[event];
                            if (!notif) return [3 /*break*/, 3];
                            typeMap = {
                                'payout.delivered': 'PAYOUT_DELIVERED',
                                'payout.failed': 'PAYOUT_FAILED',
                                'payout.flagged': 'PAYOUT_FLAGGED',
                            };
                            return [4 /*yield*/, this.notifications.create(payout.partnerId, typeMap[event], notif.title, notif.body, { payoutId: payout.id })];
                        case 2:
                            _b.sent();
                            _b.label = 3;
                        case 3: return [4 /*yield*/, this.prisma.webhookConfig.findMany({
                                where: {
                                    partnerId: payout.partnerId,
                                    isActive: true,
                                    events: { has: event },
                                },
                            })];
                        case 4:
                            webhooks = _b.sent();
                            if (webhooks.length === 0) {
                                this.logger.debug("No webhooks for partner ".concat(payout.partnerId, " event ").concat(event));
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, Promise.allSettled(webhooks.map(function (wh) {
                                    return _this.deliverWebhook(wh.id, payout, event, wh.url, wh.secret);
                                }))];
                        case 5:
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        // ── Deliver a single webhook ───────────────────────────────────────
        WebhooksService_1.prototype.deliverWebhook = function (webhookId, payout, event, url, secret) {
            return __awaiter(this, void 0, void 0, function () {
                var deliveryId, timestamp, payload, signature, payloadWithSig, delivery, response, error_1, statusCode;
                var _a, _b, _c, _d, _e, _f;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            deliveryId = (0, uuid_1.v4)();
                            timestamp = new Date().toISOString();
                            payload = {
                                id: deliveryId,
                                event: event,
                                payoutId: payout.id,
                                partnerReference: payout.partnerReference,
                                status: payout.status,
                                nairaAmount: payout.nairaAmountKobo / 100, // convert kobo → NGN decimal for partners
                                deliveredAt: (_a = payout.deliveredAt) === null || _a === void 0 ? void 0 : _a.toISOString(),
                                failureReason: (_b = payout.failureReason) !== null && _b !== void 0 ? _b : undefined,
                                timestamp: timestamp,
                            };
                            signature = this.sign(payload, secret);
                            payloadWithSig = __assign(__assign({}, payload), { signature: signature });
                            return [4 /*yield*/, this.prisma.webhookDelivery.create({
                                    data: {
                                        id: deliveryId,
                                        payoutId: payout.id,
                                        webhookId: webhookId,
                                        event: event,
                                        payload: payloadWithSig,
                                        status: 'PENDING',
                                        attempt: 1,
                                    },
                                })];
                        case 1:
                            delivery = _g.sent();
                            _g.label = 2;
                        case 2:
                            _g.trys.push([2, 5, , 8]);
                            return [4 /*yield*/, axios_1.default.post(url, payloadWithSig, {
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-Elorge-Signature': "sha256=".concat(signature),
                                        'X-Elorge-Event': event,
                                        'X-Elorge-Delivery': deliveryId,
                                    },
                                    timeout: 10000,
                                })];
                        case 3:
                            response = _g.sent();
                            return [4 /*yield*/, this.prisma.webhookDelivery.update({
                                    where: { id: delivery.id },
                                    data: {
                                        status: 'SUCCESS',
                                        responseCode: response.status,
                                        responseBody: JSON.stringify(response.data).substring(0, 500),
                                    },
                                })];
                        case 4:
                            _g.sent();
                            this.logger.log("Webhook delivered: ".concat(event, " \u2192 ").concat(url, " [").concat(response.status, "]"));
                            return [3 /*break*/, 8];
                        case 5:
                            error_1 = _g.sent();
                            statusCode = axios_1.default.isAxiosError(error_1) ? ((_d = (_c = error_1.response) === null || _c === void 0 ? void 0 : _c.status) !== null && _d !== void 0 ? _d : 0) : 0;
                            return [4 /*yield*/, this.prisma.webhookDelivery.update({
                                    where: { id: delivery.id },
                                    data: {
                                        status: 'FAILED',
                                        responseCode: statusCode,
                                        responseBody: axios_1.default.isAxiosError(error_1)
                                            ? String((_f = (_e = error_1.response) === null || _e === void 0 ? void 0 : _e.data) !== null && _f !== void 0 ? _f : error_1.message).substring(0, 500)
                                            : String(error_1),
                                        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
                                    },
                                })];
                        case 6:
                            _g.sent();
                            this.logger.warn("Webhook delivery failed: ".concat(event, " \u2192 ").concat(url, " [").concat(statusCode, "]"));
                            return [4 /*yield*/, this.notifications.create(payout.partnerId, 'WEBHOOK_FAILED', 'Webhook Delivery Failed', "Failed to deliver ".concat(event, " to ").concat(url, ". A retry is scheduled in 5 minutes."), { webhookId: webhookId, payoutId: payout.id, statusCode: statusCode })];
                        case 7:
                            _g.sent();
                            return [3 /*break*/, 8];
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        // ── Register a webhook URL for a partner ──────────────────────────
        WebhooksService_1.prototype.register = function (partnerId, url, events) {
            return __awaiter(this, void 0, void 0, function () {
                var secret, webhook;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            secret = crypto.randomBytes(32).toString('hex');
                            return [4 /*yield*/, this.prisma.webhookConfig.create({
                                    data: { partnerId: partnerId, url: url, events: events, secret: secret, isActive: true },
                                })];
                        case 1:
                            webhook = _a.sent();
                            return [2 /*return*/, { id: webhook.id, secret: secret }];
                    }
                });
            });
        };
        // ── List webhooks for a partner ───────────────────────────────────
        WebhooksService_1.prototype.list = function (partnerId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.prisma.webhookConfig.findMany({
                            where: { partnerId: partnerId },
                            orderBy: { createdAt: 'desc' },
                        })];
                });
            });
        };
        // ── HMAC-SHA256 signing ───────────────────────────────────────────
        WebhooksService_1.prototype.sign = function (payload, secret) {
            return crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');
        };
        return WebhooksService_1;
    }());
    __setFunctionName(_classThis, "WebhooksService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        WebhooksService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return WebhooksService = _classThis;
}();
exports.WebhooksService = WebhooksService;
