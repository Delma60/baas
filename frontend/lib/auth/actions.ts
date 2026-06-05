// frontend/lib/auth/actions.ts
"use server";

import { signIn, signOut } from "@/lib/auth";
import { platformSignUp, ApiError } from "@/lib/api/client";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

const SignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  name: z.string().min(1, "Name is required").max(100),
});

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type AuthState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

// ─── Sign Up ──────────────────────────────────────────────────────────────

export async function signUpAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
  };

  const parsed = SignUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // 1. Register the platform account
  try {
    await platformSignUp(parsed.data);
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 409) {
        return { errors: { email: ["An account with this email already exists"] } };
      }
    }
    return { message: "Something went wrong. Please try again." };
  }

  // 2. Auto sign-in after successful signup.
  //    signIn() with redirectTo throws a NEXT_REDIRECT internally — that's expected and must be re-thrown.
  //    AuthErrors are returned as state. Unexpected errors bubble up.
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    // NEXT_REDIRECT is thrown by Next.js internally — always re-throw it
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;

    if (err instanceof AuthError) {
      // Signup succeeded but auto-login failed — send to login with a hint
      redirect("/login?registered=1");
    }
    // Unexpected error during auto sign-in
    redirect("/login?registered=1");
  }

  // signIn with redirectTo never returns — it throws NEXT_REDIRECT
  // This line is unreachable but satisfies TypeScript
  return null;
}

// ─── Sign In ──────────────────────────────────────────────────────────────

export async function signInAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = SignInSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    // NEXT_REDIRECT must always be re-thrown — it's how Next.js performs server-side redirects
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;

    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { message: "Invalid email or password." };

        case "CallbackRouteError": {
          // authorize() threw a custom Error — check the cause chain
          // Auth.js v5 wraps it: CallbackRouteError → cause.err
          const cause = (err as any).cause?.err;
          if (cause instanceof Error && cause.message === "ACCOUNT_SUSPENDED") {
            return {
              message:
                "Your account has been suspended. Please contact support.",
            };
          }
          return { message: "Something went wrong. Please try again." };
        }

        default:
          return { message: "Something went wrong. Please try again." };
      }
    }

    // Any other error is unexpected — bubble up
    throw err;
  }

  // Unreachable — signIn with redirectTo always throws NEXT_REDIRECT
  return null;
}

// ─── OAuth ────────────────────────────────────────────────────────────────

export async function signInWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

// ─── Sign Out ─────────────────────────────────────────────────────────────

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}