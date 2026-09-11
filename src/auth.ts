import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { allowedEmail } from './lib/auth-policy';
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  callbacks: {
    async signIn({ profile, user }) {
      return profile?.email_verified === true && allowedEmail(user.email);
    },
  },
  pages: { signIn: '/login', error: '/login' },
});
