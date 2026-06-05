// frontend/lib/auth/config.ts
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { ApiError } from "@/lib/api/client";

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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

        try {
          // Import here to avoid module-level side effects at build time
          const { platformSignIn } = await import("@/lib/api/client");
          const { user } = await platformSignIn(parsed.data);

          return {
            id: user.id,
            email: user.email,
            name: user.name ?? parsed.data.email.split("@")[0],
            image: null,
          };
        } catch (err) {
          if (err instanceof ApiError) {
            if (err.status === 403) {
              // Banned account — surface as a distinct error type
              throw new Error("ACCOUNT_SUSPENDED");
            }

            if (err.status === 401 && err.code === "INVALID_INTERNAL_SECRET") {
              throw new Error("AUTH_SERVICE_UNAVAILABLE");
            }
          }

          // Return null for invalid email/password or other auth failures
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
      const isDashboard =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/projects");
      const isSuperadmin = nextUrl.pathname.startsWith("/superadmin");
      const isAuthPage =
        nextUrl.pathname === "/login" ||
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