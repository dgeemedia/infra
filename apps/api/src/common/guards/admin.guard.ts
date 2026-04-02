// apps/api/src/common/guards/admin.guard.ts
import {
  CanActivate, ExecutionContext, Injectable, ForbiddenException,
} from '@nestjs/common';
import { JwtService }    from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request }  from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService:    JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request    = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new ForbiddenException('Admin access required');
    }

    try {
      const token   = authHeader.substring(7);
      const payload = this.jwtService.verify<{
        sub:   string;
        email: string;
        role:  string;
      }>(token, {
        secret: this.configService.get<string>('app.jwtSecret'),
      });

      if (payload.role !== 'ADMIN') {
        throw new ForbiddenException('Admin access required');
      }

      return true;
    } catch {
      throw new ForbiddenException('Admin access required');
    }
  }
}