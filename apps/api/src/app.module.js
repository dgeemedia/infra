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
exports.AppModule = void 0;
// apps/api/src/app.module.ts
var common_1 = require("@nestjs/common");
var core_1 = require("@nestjs/core");
var config_1 = require("@nestjs/config");
var bull_1 = require("@nestjs/bull");
var schedule_1 = require("@nestjs/schedule");
var terminus_1 = require("@nestjs/terminus");
var axios_1 = require("@nestjs/axios");
var prisma_module_1 = require("./database/prisma.module");
var app_config_1 = require("./config/app.config");
var auth_module_1 = require("./modules/auth/auth.module");
var partners_module_1 = require("./modules/partners/partners.module");
var payouts_module_1 = require("./modules/payouts/payouts.module");
var compliance_module_1 = require("./modules/compliance/compliance.module");
var webhooks_module_1 = require("./modules/webhooks/webhooks.module");
var notifications_module_1 = require("./modules/notifications/notifications.module");
var psp_module_1 = require("./modules/psp/psp.module");
var admin_module_1 = require("./modules/admin/admin.module");
var health_controller_1 = require("./health.controller");
var api_key_guard_1 = require("./common/guards/api-key.guard");
var van_module_1 = require("./modules/van/van.module");
var AppModule = function () {
    var _classDecorators = [(0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    load: [app_config_1.appConfig, app_config_1.databaseConfig, app_config_1.redisConfig, app_config_1.pspConfig, app_config_1.complianceConfig],
                }),
                prisma_module_1.PrismaModule,
                bull_1.BullModule.forRootAsync({
                    inject: [config_1.ConfigService],
                    useFactory: function (config) {
                        var _a, _b;
                        return ({
                            redis: (_a = config.get('redis.url')) !== null && _a !== void 0 ? _a : 'redis://localhost:6379',
                            defaultJobOptions: { removeOnComplete: true, removeOnFail: false },
                            tls: ((_b = config.get('redis.url')) === null || _b === void 0 ? void 0 : _b.startsWith('rediss')) ? {} : undefined,
                        });
                    },
                }),
                schedule_1.ScheduleModule.forRoot(),
                terminus_1.TerminusModule,
                axios_1.HttpModule,
                auth_module_1.AuthModule,
                partners_module_1.PartnersModule,
                payouts_module_1.PayoutsModule,
                compliance_module_1.ComplianceModule,
                webhooks_module_1.WebhooksModule,
                notifications_module_1.NotificationsModule,
                psp_module_1.PspModule,
                admin_module_1.AdminModule,
                van_module_1.VanModule,
            ],
            controllers: [health_controller_1.HealthController],
            providers: [
                { provide: core_1.APP_GUARD, useClass: api_key_guard_1.ApiKeyGuard },
            ],
        })];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AppModule = _classThis = /** @class */ (function () {
        function AppModule_1() {
        }
        return AppModule_1;
    }());
    __setFunctionName(_classThis, "AppModule");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AppModule = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AppModule = _classThis;
}();
exports.AppModule = AppModule;
