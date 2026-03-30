// apps/api/src/common/decorators/current-partner.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { AuthenticatedPartner } from '@elorge/types';

export const CurrentPartner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedPartner => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.partner as AuthenticatedPartner;
  },
);