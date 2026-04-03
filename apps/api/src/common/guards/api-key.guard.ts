// apps/api/src/common/guards/api-key.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request }   from 'express';

import { ERROR_CODES }   from '@elorge/constants';
import { AuthService }   from '../../modules/auth/auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector:   Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ── 1. Skip @Public() routes ─────────────────────────────
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request    = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException({
        code:    ERROR_CODES.MISSING_API_KEY,
        message: 'Authorization header is required.',
      });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException({
        code:    ERROR_CODES.MISSING_API_KEY,
        message: 'Authorization format must be: Bearer <key_or_token>',
      });
    }

    // ── 2. JWT (dashboard session) vs raw API key ─────────────
    //
    // JWTs always start with "eyJ" (base64url of '{"alg":...')
    // and have exactly 3 dot-separated segments.
    // Raw API keys start with "el_live_" or "el_test_" — never "eyJ".
    //
    if (this.isJwt(token)) {
      // Dashboard user — verify signature + DB status check
      const partner = await this.authService.validateJwtToken(token);

      if (!partner) {
        throw new UnauthorizedException({
          code:    ERROR_CODES.INVALID_API_KEY,
          message: 'Session expired or invalid. Please sign in again.',
        });
      }

      request.partner = partner;
      return true;
    }

    // ── 3. Raw API key (external partner integrations) ────────
    const partner = await this.authService.validateApiKey(token);

    if (!partner) {
      throw new UnauthorizedException({
        code:    ERROR_CODES.INVALID_API_KEY,
        message: 'The provided API key is invalid or has been revoked.',
      });
    }

    request.partner = partner;
    return true;
  }

  private isJwt(token: string): boolean {
    return token.startsWith('eyJ') && token.split('.').length === 3;
  }
}