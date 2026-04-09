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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutsModule = void 0;
// apps/api/src/modules/payouts/payouts.module.ts
var common_1 = require("@nestjs/common");
var bull_1 = require("@nestjs/bull");
var compliance_module_1 = require("../compliance/compliance.module");
var psp_module_1 = require("../psp/psp.module");
var webhooks_module_1 = require("../webhooks/webhooks.module");
var payout_queue_1 = require("../../queues/payout.queue");
var payouts_controller_1 = require("./payouts.controller");
var payouts_repository_1 = require("./payouts.repository");
var payouts_service_1 = require("./payouts.service");
var payout_queue_processor_1 = require("../../queues/payout.queue.processor");
var PayoutsModule = function () {
    var _classDecorators = [(0, common_1.Module)({
            imports: [
                bull_1.BullModule.registerQueue({ name: payout_queue_1.PAYOUT_QUEUE }),
                compliance_module_1.ComplianceModule,
                psp_module_1.PspModule,
                webhooks_module_1.WebhooksModule,
            ],
            controllers: [payouts_controller_1.PayoutsController],
            providers: [payouts_service_1.PayoutsService, payouts_repository_1.PayoutsRepository, payout_queue_processor_1.PayoutQueueProcessor],
            exports: [payouts_service_1.PayoutsService],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var PayoutsModule = _classThis = /** @class */ (function () {
        function PayoutsModule_1() {
        }
        return PayoutsModule_1;
    }());
    __setFunctionName(_classThis, "PayoutsModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PayoutsModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PayoutsModule = _classThis;
}();
exports.PayoutsModule = PayoutsModule;
