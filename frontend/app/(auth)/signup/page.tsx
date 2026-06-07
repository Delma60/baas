"use client";
// frontend/app/(auth)/signup/page.tsx

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  signUpAction,
  signInWithGitHub,
  signInWithGoogle,
} from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  Globe,
} from "lucide-react";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule) => (
        <div key={rule.label} className="flex items-center gap-1.5">
          <CheckCircle2
            className={`h-3 w-3 transition-colors ${
              rule.test(password) ? "text-green-500" : "text-text-muted"
            }`}
          />
          <span
            className={`text-xs transition-colors ${
              rule.test(password)
                ? "text-green-600 dark:text-green-400"
                : "text-text-muted"
            }`}
          >
            {rule.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex h-9 w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-all hover:bg-brand-hover hover:shadow-brand/35 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Creating account…
        </>
      ) : (
        <>
          Create account
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

export default function SignUpPage() {
  const [state, formAction] = useActionState(signUpAction, null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");

  useEffect(() => {
    if (state?.message || state?.errors) {
      setPassword("");
    }
  }, [state]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-black/5">
      {/* Header */}
      <div className="border-b border-border px-7 py-6">
        <h1 className="text-xl font-bold text-text-primary">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Start building your backend in seconds — free forever
        </p>
      </div>

      <div className="px-7 py-6">
        {/* OAuth buttons */}
        <div className="flex gap-3">
          <form action={signInWithGitHub} className="flex-1">
            <button
              type="submit"
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              <GitBranch className="h-4 w-4" />
              GitHub
            </button>
          </form>
          <form action={signInWithGoogle} className="flex-1">
            <button
              type="submit"
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              <Globe className="h-4 w-4" />
              Google
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="relative my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Global error */}
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
              htmlFor="name"
              className="text-xs font-medium text-text-secondary"
            >
              Full name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-9 border-border bg-background text-text-primary placeholder:text-text-muted focus-visible:border-brand focus-visible:ring-brand/20"
            />
            {state?.errors?.name && (
              <p className="text-xs text-red-500">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="organizationName"
              className="text-xs font-medium text-text-secondary"
            >
              Organization name
            </Label>
            <Input
              id="organizationName"
              name="organizationName"
              type="text"
              required
              placeholder="Acme Inc"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              className="h-9 border-border bg-background text-text-primary placeholder:text-text-muted focus-visible:border-brand focus-visible:ring-brand/20"
            />
            {state?.errors?.organizationName && (
              <p className="text-xs text-red-500">
                {state.errors.organizationName[0]}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-medium text-text-secondary"
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-9 border-border bg-background text-text-primary placeholder:text-text-muted focus-visible:border-brand focus-visible:ring-brand/20"
            />
            {state?.errors?.email && (
              <p className="text-xs text-red-500">{state.errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-medium text-text-secondary"
            >
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-9 border-border bg-background text-text-primary placeholder:text-text-muted focus-visible:border-brand focus-visible:ring-brand/20"
            />
            {state?.errors?.password ? (
              <p className="text-xs text-red-500">{state.errors.password[0]}</p>
            ) : null}
          </div>

          <SubmitButton />
        </form>

        <p className="mt-4 text-center text-xs text-text-muted">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-brand hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-brand hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-background px-7 py-4">
        <p className="text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
