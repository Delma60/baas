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

  // Register the platform account
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

  // Auto sign-in after successful signup
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    // Sign-in failed after signup (unusual) — send to login with a hint
    redirect("/login?registered=1");
  }

  redirect("/dashboard");
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
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { message: "Invalid email or password" };
        case "CallbackRouteError":
          // Surfaced when authorize() throws (e.g. ACCOUNT_SUSPENDED or auth service misconfiguration)
          if (err.cause?.err?.message === "ACCOUNT_SUSPENDED") {
            return { message: "Your account has been suspended. Please contact support." };
          }
          if (
            err.cause?.err?.message === "AUTH_SERVICE_UNAVAILABLE" ||
            err.cause?.message === "AUTH_SERVICE_UNAVAILABLE"
          ) {
            return {
              message:
                "Authentication is temporarily unavailable. Please check backend configuration and try again.",
            };
          }
          return { message: "Something went wrong. Please try again." };
        default:
          return { message: "Something went wrong. Please try again." };
      }
    }
    throw err; // re-throw the Next.js redirect
  }

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