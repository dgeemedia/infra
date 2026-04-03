// apps/api/src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as public — bypasses ApiKeyGuard.
 * Use for: /health, /v1/docs, auth endpoints
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
