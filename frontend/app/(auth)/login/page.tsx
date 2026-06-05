"use client";
// frontend/app/(auth)/login/page.tsx

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  signInAction,
  signInWithGitHub,
  signInWithGoogle,
} from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, AlertCircle, GitBranch, Globe } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex h-9 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-[--brand] px-4 text-sm font-semibold text-white shadow-md shadow-[--brand]/25 transition-all hover:bg-[--brand-hover] hover:shadow-[--brand]/35 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Signing in…
        </>
      ) : (
        <>
          Sign in
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(signInAction, null);

  return (
    <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface] shadow-xl shadow-black/5">
      {/* Header strip */}
      <div className="border-b border-[--border] px-7 py-6">
        <h1 className="text-xl font-bold text-[--text-primary]">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-[--text-secondary]">
          Sign in to your YourBaaS dashboard
        </p>
      </div>

      <div className="px-7 py-6">
        {/* OAuth buttons */}
        <div className="flex gap-3">
          <form action={signInWithGitHub} className="flex-1">
            <button
              type="submit"
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[--border] bg-[--background] text-sm font-medium text-[--text-primary] transition-colors hover:bg-[--surface-hover]"
            >
              <GitBranch className="h-4 w-4" />
              GitHub
            </button>
          </form>
          <form action={signInWithGoogle} className="flex-1">
            <button
              type="submit"
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[--border] bg-[--background] text-sm font-medium text-[--text-primary] transition-colors hover:bg-[--surface-hover]"
            >
              <Globe className="h-4 w-4" />
              Google
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[--border]" />
          <span className="text-xs font-medium text-[--text-muted]">or</span>
          <div className="h-px flex-1 bg-[--border]" />
        </div>

        {/* Error */}
        {state?.message && (
          <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {state.message}
          </div>
        )}

        {/* Form */}
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-medium text-[--text-secondary]"
            >
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-9 border-[--border] bg-[--background] text-[--text-primary] placeholder:text-[--text-muted] focus-visible:border-[--brand] focus-visible:ring-[--brand]/20"
            />
            {state?.errors?.email && (
              <p className="text-xs text-red-500">{state.errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-xs font-medium text-[--text-secondary]"
              >
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-[--brand] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-9 border-[--border] bg-[--background] text-[--text-primary] placeholder:text-[--text-muted] focus-visible:border-[--brand] focus-visible:ring-[--brand]/20"
            />
            {state?.errors?.password && (
              <p className="text-xs text-red-500">{state.errors.password[0]}</p>
            )}
          </div>

          <SubmitButton />
        </form>
      </div>

      {/* Footer */}
      <div className="border-t border-[--border] bg-[--background] px-7 py-4">
        <p className="text-center text-sm text-[--text-secondary]">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-[--brand] hover:underline"
          >
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
