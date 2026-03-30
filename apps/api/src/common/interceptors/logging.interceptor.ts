// apps/api/src/common/interceptors/logging.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request   = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const partnerId = request.partner?.id ?? 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<{ statusCode: number }>();
          const duration = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} → ${response.statusCode} [${duration}ms] partner=${partnerId}`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `${method} ${url} → ERROR [${duration}ms] partner=${partnerId} err=${error.message}`,
          );
        },
      }),
    );
  }
}