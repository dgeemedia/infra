// apps/dashboard/src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name: string;
      email: string;
    } & DefaultSession['user'];
  }

  interface JWT {
    accessToken?: string;
    id?: string;
  }
}