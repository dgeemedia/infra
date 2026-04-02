// apps/dashboard/src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT }           from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id:    string;
      name:  string;
      email: string;
      role:  string;   // 'ADMIN' | 'PARTNER'
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    accessToken?: string;
    role?:        string;
  }
}

// Must augment 'next-auth/jwt' — not 'next-auth' — for the JWT interface
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    id?:          string;
    role?:        string;
  }
}