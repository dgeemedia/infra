// apps/api/src/common/guards/api-key.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { ERROR_CODES } from '@elorge/constants';
import { AuthService } from '../../modules/auth/auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector:   Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request   = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException({
        code:    ERROR_CODES.MISSING_API_KEY,
        message: 'Authorization header is required.',
      });
    }

    const [scheme, key] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !key) {
      throw new UnauthorizedException({
        code:    ERROR_CODES.MISSING_API_KEY,
        message: 'Authorization format must be: Bearer <api_key>',
      });
    }

    const partner = await this.authService.validateApiKey(key);

    if (!partner) {
      throw new UnauthorizedException({
        code:    ERROR_CODES.INVALID_API_KEY,
        message: 'The provided API key is invalid or has been revoked.',
      });
    }

    request.partner = partner;
    return true;
  }
}