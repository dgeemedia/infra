// apps/api/src/common/interceptors/transform.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  success:   boolean;
  data:      T;
  timestamp: string;
}

/**
 * Wraps every successful response in a consistent envelope:
 * { success: true, data: <payload>, timestamp: "..." }
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T) => ({
        success:   true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
