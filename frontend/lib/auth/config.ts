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

const AUTH_SECRET =
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-nextauth-secret";

export const authConfig: NextAuthConfig = {
  secret: AUTH_SECRET,
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
          // Dynamic import to avoid module-level side effects at build time
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
              // Banned account — surface as a distinct error type that
              // signInAction can catch via CallbackRouteError → cause
              throw new Error("ACCOUNT_SUSPENDED");
            }
            // Any other API error (401, 500, etc.) → invalid credentials
            return null;
          }
          // Re-throw unexpected errors (network failures, etc.)
          throw err;
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
      // `user` is only defined on initial sign-in
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
      const { pathname } = nextUrl;

      const isDashboard =
  pathname.startsWith("/dashboard") || pathname.startsWith("/projects");
const isUserDashboard = pathname.startsWith("/u/");
const isSuperadmin = pathname.startsWith("/superadmin");
const isAuthPage =
  pathname === "/login" ||
  pathname === "/signup" ||
  pathname === "/verify";

if ((isDashboard || isUserDashboard || isSuperadmin) && !isLoggedIn) {
  const loginUrl = new URL("/login", nextUrl);
  loginUrl.searchParams.set("callbackUrl", nextUrl.href);
  return Response.redirect(loginUrl);
}

if (isAuthPage && isLoggedIn) {
  const userId = auth?.user?.id;
  const dest = userId ? `/u/${userId}` : "/u";
  return Response.redirect(new URL(dest, nextUrl));
}


      return true;
    },
  },

  session: { strategy: "jwt" },
  trustHost: true,
};