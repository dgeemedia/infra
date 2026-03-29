import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider       from 'next-auth/providers/credentials';
import axios                     from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
          const { data } = await axios.post<{
            success: boolean;
            data: { accessToken: string };
          }>(
            `${API_URL}/auth/login`,
            { email: credentials.email, password: credentials.password },
          );

          if (data.success && data.data.accessToken) {
            // Decode JWT to get user info
            const payload = JSON.parse(
              Buffer.from(data.data.accessToken.split('.')[1] ?? '', 'base64').toString(),
            ) as { sub: string; email: string; name: string };

            return {
              id:          payload.sub,
              email:       payload.email,
              name:        payload.name,
              accessToken: data.data.accessToken,
            };
          }
          return null;
        } catch {
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
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken    = token.accessToken as string;
      session.user.id        = token.id as string;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: {
    strategy:  'jwt',
    maxAge:    7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
