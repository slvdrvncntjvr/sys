import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertLoginRateLimit } from "@/lib/rate-limit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Owner credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        const trustedOwnerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();

        const ipHeader = req.headers?.["x-forwarded-for"];
        const ip = Array.isArray(ipHeader)
          ? ipHeader[0]
          : ipHeader?.split(",")[0]?.trim() ?? "unknown";

        await assertLoginRateLimit(`login:${ip}`);

        if (!trustedOwnerEmail || email !== trustedOwnerEmail || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.role !== UserRole.OWNER) {
          return null;
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        const role = (user as { role?: "OWNER" }).role;
        if (role) {
          token.role = role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub && token.email && token.role === "OWNER") {
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.role = "OWNER";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};

export async function getOwnerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.role !== "OWNER") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, role: true },
  });

  if (!user || user.role !== UserRole.OWNER) {
    return null;
  }

  return user;
}
