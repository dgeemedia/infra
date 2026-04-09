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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
// apps/api/src/common/filters/global-exception.filter.ts
var common_1 = require("@nestjs/common");
var constants_1 = require("@elorge/constants");
var GlobalExceptionFilter = function () {
    var _classDecorators = [(0, common_1.Catch)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var GlobalExceptionFilter = _classThis = /** @class */ (function () {
        function GlobalExceptionFilter_1() {
            this.logger = new common_1.Logger(GlobalExceptionFilter.name);
        }
        GlobalExceptionFilter_1.prototype.catch = function (exception, host) {
            var _a, _b;
            var ctx = host.switchToHttp();
            var response = ctx.getResponse();
            var request = ctx.getRequest();
            var statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            var code = constants_1.ERROR_CODES.INTERNAL_SERVER_ERROR;
            var message = 'An unexpected error occurred.';
            var errors = undefined;
            if (exception instanceof common_1.HttpException) {
                statusCode = exception.getStatus();
                var exceptionResponse = exception.getResponse();
                if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                    var res = exceptionResponse;
                    code = ((_a = res['code']) !== null && _a !== void 0 ? _a : this.httpStatusToCode(statusCode));
                    message = (_b = res['message']) !== null && _b !== void 0 ? _b : exception.message;
                    errors = res['errors'];
                }
                else {
                    message = exceptionResponse;
                    code = this.httpStatusToCode(statusCode);
                }
            }
            else if (exception instanceof Error) {
                this.logger.error("Unhandled error: ".concat(exception.message), exception.stack);
            }
            var errorResponse = __assign(__assign({ statusCode: statusCode, code: code, message: message }, (errors ? { errors: errors } : {})), { timestamp: new Date().toISOString(), path: request.url });
            // Log server errors
            if (statusCode >= 500) {
                this.logger.error("".concat(request.method, " ").concat(request.url, " \u2192 ").concat(statusCode), exception instanceof Error ? exception.stack : String(exception));
            }
            response.status(statusCode).json(errorResponse);
        };
        GlobalExceptionFilter_1.prototype.httpStatusToCode = function (status) {
            var _a;
            var map = {
                400: constants_1.ERROR_CODES.INVALID_REQUEST_BODY,
                401: constants_1.ERROR_CODES.INVALID_API_KEY,
                403: constants_1.ERROR_CODES.INSUFFICIENT_PERMISSION,
                404: constants_1.ERROR_CODES.PAYOUT_NOT_FOUND,
                429: constants_1.ERROR_CODES.RATE_LIMIT_EXCEEDED,
                500: constants_1.ERROR_CODES.INTERNAL_SERVER_ERROR,
                503: constants_1.ERROR_CODES.SERVICE_UNAVAILABLE,
            };
            return (_a = map[status]) !== null && _a !== void 0 ? _a : constants_1.ERROR_CODES.INTERNAL_SERVER_ERROR;
        };
        return GlobalExceptionFilter_1;
    }());
    __setFunctionName(_classThis, "GlobalExceptionFilter");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        GlobalExceptionFilter = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return GlobalExceptionFilter = _classThis;
}();
exports.GlobalExceptionFilter = GlobalExceptionFilter;
