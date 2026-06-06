// frontend/app/dashboard/projects/new/page.tsx
"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Server,
  Globe,
  AlertCircle,
  CheckCircle2,
  Database,
  Layers,
  ShieldCheck,
  HardDrive,
  Radio,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createProjectAction } from "@/lib/actions/project-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Region config ────────────────────────────────────────────────────────────

const REGIONS = [
  {
    id: "lagos",
    name: "Lagos",
    country: "Nigeria",
    flag: "🇳🇬",
    ping: "~8ms",
    badge: "Recommended",
    badgeColor: "bg-[--brand]/10 text-[--brand]",
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    ping: "~35ms",
    badge: null,
    badgeColor: "",
  },
  {
    id: "singapore",
    name: "Singapore",
    country: "Singapore",
    flag: "🇸🇬",
    ping: "~120ms",
    badge: null,
    badgeColor: "",
  },
] as const;

// ─── Module list (all enabled by default) ─────────────────────────────────────

const MODULES = [
  { id: "sql", label: "SQL Database", icon: Database, color: "text-blue-500" },
  { id: "nosql", label: "NoSQL / KV", icon: Layers, color: "text-green-500" },
  { id: "auth", label: "Auth", icon: ShieldCheck, color: "text-purple-500" },
  { id: "storage", label: "Storage", icon: HardDrive, color: "text-yellow-500" },
  { id: "realtime", label: "Realtime", icon: Radio, color: "text-red-500" },
  { id: "ai", label: "AI / Vectors", icon: Sparkles, color: "text-pink-500" },
  { id: "functions", label: "Functions", icon: Zap, color: "text-orange-500" },
];

// ─── Submit button ────────────────────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex h-9 items-center gap-2 rounded-lg bg-[--brand] px-5 text-sm font-semibold text-white shadow-md shadow-[--brand]/20 transition-all hover:bg-[--brand-hover] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          Creating project…
        </>
      ) : (
        <>
          Create project
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

// ─── Name validation hint ─────────────────────────────────────────────────────

const NAME_RULES = [
  { label: "At least 2 characters", test: (v: string) => v.length >= 2 },
  { label: "Lowercase letters, numbers, hyphens", test: (v: string) => /^[a-z0-9-]*$/.test(v) },
  { label: "No leading or trailing hyphens", test: (v: string) => !/^-|-$/.test(v) },
];

function NameHints({ value }: { value: string }) {
  if (!value) return null;
  return (
    <div className="mt-2 space-y-1">
      {NAME_RULES.map((rule) => (
        <div key={rule.label} className="flex items-center gap-1.5">
          <CheckCircle2
            className={cn(
              "h-3 w-3 transition-colors",
              rule.test(value) ? "text-green-500" : "text-[--text-muted]"
            )}
          />
          <span
            className={cn(
              "text-xs transition-colors",
              rule.test(value) ? "text-green-600 dark:text-green-400" : "text-[--text-muted]"
            )}
          >
            {rule.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProjectPage() {
  const [state, formAction] = useActionState(createProjectAction, null);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("lagos");
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[--text-secondary] hover:text-[--text-primary] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-medium text-[--text-primary]">Create a new project</h1>
        <p className="mt-1 text-sm text-[--text-secondary]">
          Each project gets its own isolated PostgreSQL schema, MongoDB database, and storage bucket.
        </p>
      </div>

      {/* Global error */}
      {state?.message && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}

      <form action={formAction} className="space-y-8">
        {/* ── Project name ── */}
        <section className="rounded-xl border border-[--border] bg-[--background] p-5">
          <h2 className="mb-4 text-sm font-medium text-[--text-primary]">Project details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-[--text-secondary]">
              Project name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="my-awesome-api"
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              className={cn(
                "h-9 border-[--border] bg-[--surface] font-mono text-sm text-[--text-primary] placeholder:text-[--text-muted] placeholder:font-sans",
                "focus-visible:border-[--brand] focus-visible:ring-[--brand]/20",
                state?.errors?.name && "border-red-400"
              )}
            />
            {state?.errors?.name ? (
              <p className="text-xs text-red-500">{state.errors.name[0]}</p>
            ) : (
              <NameHints value={name} />
            )}
            <p className="text-xs text-[--text-muted]">
              Used as your project slug. Cannot be changed after creation.
            </p>
          </div>

          <div className="mt-4 space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-[--text-secondary]">
              Description{" "}
              <span className="font-normal text-[--text-muted]">(optional)</span>
            </Label>
            <Input
              id="description"
              name="description"
              type="text"
              placeholder="What does this project do?"
              className="h-9 border-[--border] bg-[--surface] text-sm text-[--text-primary] placeholder:text-[--text-muted] focus-visible:border-[--brand] focus-visible:ring-[--brand]/20"
            />
          </div>
        </section>

        {/* ── Region ── */}
        <section className="rounded-xl border border-[--border] bg-[--background] p-5">
          <h2 className="mb-1 text-sm font-medium text-[--text-primary]">Deploy region</h2>
          <p className="mb-4 text-xs text-[--text-muted]">
            Choose the region closest to your users for lowest latency.
          </p>

          <input type="hidden" name="region" value={region} />

          <div className="grid gap-2 sm:grid-cols-3">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRegion(r.id)}
                className={cn(
                  "relative flex flex-col items-start gap-1 rounded-lg border p-3.5 text-left transition-all",
                  region === r.id
                    ? "border-[--brand] bg-[--brand]/5 shadow-sm"
                    : "border-[--border] hover:border-[--border2]"
                )}
              >
                {r.badge && (
                  <span
                    className={cn(
                      "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      r.badgeColor
                    )}
                  >
                    {r.badge}
                  </span>
                )}
                <span className="text-xl">{r.flag}</span>
                <div>
                  <p className="text-[13px] font-medium text-[--text-primary]">{r.name}</p>
                  <p className="text-xs text-[--text-muted]">{r.country}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[--text-muted]">
                  <MapPin className="h-3 w-3" />
                  {r.ping}
                </div>
                {region === r.id && (
                  <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[--brand]" />
                )}
              </button>
            ))}
          </div>

          {state?.errors?.region && (
            <p className="mt-2 text-xs text-red-500">{state.errors.region[0]}</p>
          )}
        </section>

        {/* ── Included modules ── */}
        <section className="rounded-xl border border-[--border] bg-[--background] p-5">
          <h2 className="mb-1 text-sm font-medium text-[--text-primary]">Included modules</h2>
          <p className="mb-4 text-xs text-[--text-muted]">
            All modules are included and ready to use. No extra setup required.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className="flex items-center gap-2 rounded-lg border border-[--border] bg-[--surface] px-3 py-2.5"
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", mod.color)} />
                  <span className="text-xs font-medium text-[--text-secondary]">{mod.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── What gets created ── */}
        <section className="rounded-xl border border-[--border] bg-[--surface] p-5">
          <h2 className="mb-3 text-sm font-medium text-[--text-primary]">What gets provisioned</h2>
          <div className="space-y-2 text-xs text-[--text-secondary]">
            {[
              { icon: Server, text: "Isolated PostgreSQL schema with pgvector" },
              { icon: Layers, text: "MongoDB database with _kv collection & TTL index" },
              { icon: HardDrive, text: "MinIO storage bucket (S3-compatible)" },
              { icon: ShieldCheck, text: "Per-project auth with JWT (email/password + OAuth)" },
              { icon: Globe, text: "Anon + service API keys generated" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[--text-muted]" />
                {text}
              </div>
            ))}
          </div>
        </section>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3">
          <SubmitButton />
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 items-center rounded-lg border border-[--border] px-4 text-sm font-medium text-[--text-secondary] transition-colors hover:bg-[--surface-hover]"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}