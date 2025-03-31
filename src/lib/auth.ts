import { AuthOptions, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import prisma from '@/lib/db';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from "next-auth/providers/google";

// Define admin emails
const ADMIN_EMAILS = ['joseph.liao1018@gmail.com'];

interface CustomUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    }
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
        
        if (!user) {
          return null;
        }
        
        const isPasswordValid = await compare(credentials.password, user.hashedPassword);
        
        if (!isPasswordValid) {
          return null;
        }
        
        const customUser: CustomUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: ADMIN_EMAILS.includes(user.email)
        };
        
        return customUser;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isAdmin = (user as CustomUser).isAdmin;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 