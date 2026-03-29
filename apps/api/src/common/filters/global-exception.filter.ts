import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { ERROR_CODES } from '@elorge/constants';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code       = ERROR_CODES.INTERNAL_SERVER_ERROR;
    let message    = 'An unexpected error occurred.';
    let errors: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        code    = (res['code'] as string)    ?? this.httpStatusToCode(statusCode);
        message = (res['message'] as string) ?? exception.message;
        errors  = res['errors'];
      } else {
        message = exceptionResponse as string;
        code    = this.httpStatusToCode(statusCode);
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const errorResponse = {
      statusCode,
      code,
      message,
      ...(errors ? { errors } : {}),
      timestamp: new Date().toISOString(),
      path:      request.url,
    };

    // Log server errors
    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json(errorResponse);
  }

  private httpStatusToCode(status: number): string {
    const map: Record<number, string> = {
      400: ERROR_CODES.INVALID_REQUEST_BODY,
      401: ERROR_CODES.INVALID_API_KEY,
      403: ERROR_CODES.INSUFFICIENT_PERMISSION,
      404: ERROR_CODES.PAYOUT_NOT_FOUND,
      429: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      500: ERROR_CODES.INTERNAL_SERVER_ERROR,
      503: ERROR_CODES.SERVICE_UNAVAILABLE,
    };
    return map[status] ?? ERROR_CODES.INTERNAL_SERVER_ERROR;
  }
}
