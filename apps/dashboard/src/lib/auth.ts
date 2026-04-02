// apps/dashboard/src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider       from 'next-auth/providers/credentials';
import axios                     from 'axios';

// Server-side env var — never exposed to the browser.
// Set API_URL in your dashboard/.env.local for production.
// Falls back to NEXT_PUBLIC_ for local dev convenience.
const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

// Your NestJS API uses a global response-transform interceptor that wraps
// every successful response as:  { success: true, data: <payload> }
// So /auth/login returns:         { success: true, data: { accessToken: "..." } }
type LoginResponse = {
  success: boolean;
  data:    { accessToken: string };
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name:        'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const { data } = await axios.post<LoginResponse>(
            `${API_URL}/auth/login`,
            { email: credentials.email, password: credentials.password },
          );

          // ★ Unwrap the global interceptor envelope: data.data.accessToken
          const token = data?.data?.accessToken;
          if (!token) {
            console.error('[auth] no accessToken in API response:', JSON.stringify(data));
            return null;
          }

          // Decode JWT payload — base64url, no crypto library needed here.
          // We verify the token's signature on every request via AdminGuard server-side.
          const payload = JSON.parse(
            Buffer.from(token.split('.')[1] ?? '', 'base64url').toString(),
          ) as { sub: string; email: string; name: string; role: string };

          return {
            id:          payload.sub,
            email:       payload.email,
            name:        payload.name,
            role:        payload.role,   // 'ADMIN' | 'PARTNER'
            accessToken: token,
          };
        } catch (err) {
          console.error(
            '[auth] login request failed:',
            axios.isAxiosError(err) ? err.response?.data : err,
          );
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.id          = user.id;
        token.role        = (user as { role?: string }).role;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.user.id     = token.id   as string;
      session.user.role   = token.role as string;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge:   7 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};