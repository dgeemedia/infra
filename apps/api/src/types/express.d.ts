// apps/api/src/types/express.d.ts
import type { AuthenticatedPartner } from '@elorge/types';

declare global {
  namespace Express {
    interface Request {
      partner?: AuthenticatedPartner;
    }
  }
}