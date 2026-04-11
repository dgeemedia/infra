// apps/dashboard/src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider      from 'next-auth/providers/credentials';
import axios, { isAxiosError }  from 'axios';

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

type LoginResponse = {
  success: boolean;
  data:    { accessToken: string };
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name:        'Credentials',
      credentials: {
        email:     { label: 'Email',      type: 'email'    },
        password:  { label: 'Password',   type: 'password' },
        // Hidden fields — populated by the login page before submit
        ipAddress: { label: 'IP Address', type: 'text'     },
        userAgent: { label: 'User Agent', type: 'text'     },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const { data } = await axios.post<LoginResponse>(
            `${API_URL}/auth/login`,
            {
              email:    credentials.email,
              password: credentials.password,
            },
            {
              headers: {
                // Forward the real client IP to the API
                'x-forwarded-for': credentials.ipAddress ?? '',
                'user-agent':      credentials.userAgent  ?? '',
              },
            },
          );

          const token = data?.data?.accessToken;
          if (!token) return null;

          const payload = JSON.parse(
            Buffer.from(token.split('.')[1] ?? '', 'base64url').toString(),
          ) as {
            sub:                string;
            email:              string;
            name:               string;
            role:               string;
            mustChangePassword: boolean;
          };

          return {
            id:                 payload.sub,
            email:              payload.email,
            name:               payload.name,
            role:               payload.role,
            mustChangePassword: payload.mustChangePassword ?? false,
            accessToken:        token,
          };
        } catch (err) {
          console.error('[auth] login failed:', isAxiosError(err) ? err.response?.data : err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken        = (user as { accessToken?: string }).accessToken;
        token.id                 = user.id;
        token.role               = (user as { role?: string }).role;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken  = token.accessToken as string | undefined;
      session.user.id      = token.id   as string;
      session.user.role    = token.role as string;
      // @ts-expect-error — extended session type
      session.user.mustChangePassword = token.mustChangePassword as boolean;
      return session;
    },
  },

  pages:   { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  secret:  process.env.NEXTAUTH_SECRET,
};