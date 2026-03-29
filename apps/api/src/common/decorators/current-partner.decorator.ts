import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import type { Partner } from '@elorge/types';

/**
 * Extracts the authenticated partner from the request.
 * Set by ApiKeyGuard after successful validation.
 *
 * Usage in controller:
 *   async createPayout(@CurrentPartner() partner: Partner) { ... }
 */
export const CurrentPartner = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Partner => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request['partner'] as Partner;
  },
);
