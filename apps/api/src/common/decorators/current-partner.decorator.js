"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentPartner = void 0;
// apps/api/src/common/decorators/current-partner.decorator.ts
var common_1 = require("@nestjs/common");
exports.CurrentPartner = (0, common_1.createParamDecorator)(function (_data, ctx) {
    var request = ctx.switchToHttp().getRequest();
    return request.partner;
});
