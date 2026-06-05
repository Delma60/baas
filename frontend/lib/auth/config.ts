// frontend/lib/auth/config.ts
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { z } from "zod";

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      id: "credentials",
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = SignInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const baseUrl = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";

        try {
          const res = await fetch(`${baseUrl}/internal/auth/signin`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) return null;

          const { data } = await res.json();
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name ?? email.split("@")[0],
            image: data.user.avatar_url ?? null,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    verifyRequest: "/verify",
  },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.provider = account?.provider ?? "credentials";
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session as any).provider = token.provider;
      }
      return session;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/projects");
      const isSuperadmin = nextUrl.pathname.startsWith("/superadmin");
      const isAuthPage = nextUrl.pathname === "/login" ||
        nextUrl.pathname === "/signup" ||
        nextUrl.pathname === "/verify";

      if (isDashboard || isSuperadmin) {
        if (!isLoggedIn) return false;
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },

  session: { strategy: "jwt" },
  trustHost: true,
};