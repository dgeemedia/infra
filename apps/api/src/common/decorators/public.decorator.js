"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Public = exports.IS_PUBLIC_KEY = void 0;
// apps/api/src/common/decorators/public.decorator.ts
var common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = 'isPublic';
/**
 * Mark a route as public — bypasses ApiKeyGuard.
 * Use for: /health, /v1/docs, auth endpoints
 */
var Public = function () { return (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true); };
exports.Public = Public;
