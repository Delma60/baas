// frontend/app/(dashboard)/u/[userId]/projects/new/page.tsx
"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Layers,
  ShieldCheck,
  HardDrive,
  Radio,
  Sparkles,
  Zap,
  Check,
  MapPin,
  Server,
  Globe,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createProjectAction } from "@/lib/actions/project-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Name your project", desc: "Set a unique identifier" },
  { id: 2, label: "Choose a region", desc: "Where your data lives" },
  { id: 3, label: "Review & create", desc: "Confirm and provision" },
];

const REGIONS = [
  {
    id: "lagos",
    name: "Lagos",
    subtitle: "Africa · West",
    flag: "🇳🇬",
    latency: "~8ms",
    recommended: true,
    note: "Optimised for Nigerian & African users",
  },
  {
    id: "london",
    name: "London",
    subtitle: "Europe · West",
    flag: "🇬🇧",
    latency: "~35ms",
    recommended: false,
    note: "EU/UK data residency, GDPR compliant",
  },
  {
    id: "singapore",
    name: "Singapore",
    subtitle: "Asia · Pacific",
    flag: "🇸🇬",
    latency: "~120ms",
    recommended: false,
    note: "Low latency for Southeast Asia",
  },
] as const;

const MODULES = [
  {
    id: "sql",
    label: "SQL",
    icon: Database,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    id: "nosql",
    label: "NoSQL / KV",
    icon: Layers,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "auth",
    label: "Auth",
    icon: ShieldCheck,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    id: "storage",
    label: "Storage",
    icon: HardDrive,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "realtime",
    label: "Realtime",
    icon: Radio,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    id: "ai",
    label: "AI / Vectors",
    icon: Sparkles,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    id: "functions",
    label: "Functions",
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

const NAME_RULES = [
  { label: "At least 2 characters", test: (v: string) => v.length >= 2 },
  {
    label: "Letters, numbers, spaces, hyphens",
    test: (v: string) => /^[a-zA-Z0-9\s-]+$/.test(v) && v.length > 0,
  },
  {
    label: "Must start and end with a letter or number",
    test: (v: string) =>
      v.length === 0 || /^[a-zA-Z0-9].*[a-zA-Z0-9]$/.test(v.trim()),
  },
];

function generateSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isNameValid(name: string) {
  return NAME_RULES.every((r) => r.test(name));
}

// ─── Submit button ────────────────────────────────────────────────────────────

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      // className="h-10 gap-2 bg-brand px-6 text-white hover:bg-brand-hover"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Provisioning…
        </>
      ) : (
        <>
          Create project
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewProjectPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const [userId, setUserId] = useState("");
  const [state, formAction] = useActionState(createProjectAction, null);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [region, setRegion] = useState("lagos");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    params.then((p) => setUserId(p.userId));
  }, [params]);

  const handleNameChange = (newName: string) => {
    setName(newName);
    setSlug(generateSlug(newName));
  };

  const nameValid = isNameValid(name) && slug.length > 0;
  const canGoToStep2 = nameValid;
  const canSubmit = nameValid;

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Left rail ─────────────────────────────────────────────────────── */}
      <aside className="relative hidden w-[280px] shrink-0 flex-col border-r border-border bg-muted/30 lg:flex">
        {/* Subtle dot grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative flex flex-col h-full px-6 py-8">
          {/* Back link */}
          <Link
            href={userId ? `/u/${userId}/projects` : "/dashboard"}
            className="mb-10 flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to projects
          </Link>

          {/* Title */}
          <div className="mb-10">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              New project
            </p>
            <h1 className="text-lg font-semibold text-foreground leading-snug">
              Set up your
              <br />
              infrastructure
            </h1>
          </div>

          {/* Step indicators */}
          <nav className="flex flex-col gap-0">
            {STEPS.map((s, i) => {
              const isDone = step > s.id;
              const isCurrent = step === s.id;
              const isUpcoming = step < s.id;

              return (
                <div key={s.id} className="flex gap-4">
                  {/* Line + circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                        isDone
                          ? "border-[--brand] bg-brand text-white"
                          : isCurrent
                            ? "border-[--brand] bg-background text-[--brand]"
                            : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {isDone ? <Check className="h-3.5 w-3.5" /> : s.id}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          "my-1 w-px flex-1 min-h-[32px] transition-colors duration-500",
                          step > s.id ? "bg-brand" : "bg-border",
                        )}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className="pb-8">
                    <p
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isCurrent
                          ? "text-foreground"
                          : isDone
                            ? "text-foreground/60"
                            : "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom info */}
          <div className="mt-auto">
            <Separator className="mb-4" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              All 7 modules are included in every project. No extra
              configuration needed.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Right canvas ──────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex h-12 items-center gap-3 border-b border-border px-4 lg:hidden">
          <Link
            href={userId ? `/u/${userId}/projects` : "/dashboard"}
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium">
            Step {step} of {STEPS.length}
          </span>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-6 py-10 lg:py-14">
            {/* Error */}
            {state?.message && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Something went wrong</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}

            <form ref={formRef} action={formAction}>
              {/* ── Step 1: Name ── */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Step 1 of 3
                    </p>
                    <h2 className="text-2xl font-semibold text-foreground">
                      Name your project
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      This will be your project's identifier. Choose something
                      short and memorable.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="name-input" className="text-sm font-medium">
                      Project name
                    </Label>
                    <Input
                      id="name-input"
                      name="name"
                      placeholder="My Awesome API"
                      value={name}
                      autoFocus
                      onChange={(e) => handleNameChange(e.target.value)}
                      className={cn(
                        "h-11 text-base",
                        state?.errors?.name && "border-destructive",
                      )}
                    />

                    {state?.errors?.name && (
                      <p className="text-sm text-destructive">
                        {state.errors.name[0]}
                      </p>
                    )}

                    {/* Validation checklist */}
                    {name.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {NAME_RULES.map((rule) => {
                          const passed = rule.test(name);
                          return (
                            <div
                              key={rule.label}
                              className="flex items-center gap-2"
                            >
                              {passed ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                              )}
                              <span
                                className={cn(
                                  "text-xs",
                                  passed
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-muted-foreground",
                                )}
                              >
                                {rule.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Preview */}
                    {nameValid && (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3.5 py-2.5 mt-2">
                        <span className="text-xs text-muted-foreground">
                          Project slug:
                        </span>
                        <code className="text-xs font-mono text-foreground">
                          {slug}
                        </code>
                        {/* hidden slug input */}
                        <input type="hidden" name="slug" value={slug} />
                      </div>
                    )}
                  </div>

                  {/* Optional description */}
                  <div className="space-y-2">
                    <Label htmlFor="desc-input" className="text-sm font-medium">
                      Description{" "}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="desc-input"
                      name="description"
                      placeholder="What does this project do?"
                      className="h-11"
                      defaultValue=""
                    />
                    {state?.errors?.description && (
                      <p className="text-sm text-destructive">
                        {state.errors.description[0]}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      disabled={!canGoToStep2}
                      onClick={() => setStep(2)}
                      // className="h-10 gap-2 bg-brand px-6 text-white hover:bg-brand-hover"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.back()}
                      className="h-10 text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 2: Region ── */}
              {step === 2 && (
                <div className="space-y-8 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Step 2 of 3
                    </p>
                    <h2 className="text-2xl font-semibold text-foreground">
                      Choose a region
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Pick the region closest to your users. This cannot be
                      changed after creation.
                    </p>
                  </div>

                  <input type="hidden" name="region" value={region} />

                  <div className="grid gap-3">
                    {REGIONS.map((r) => {
                      const selected = region === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRegion(r.id)}
                          className={cn(
                            "group relative flex items-center gap-5 rounded-xl border-2 p-5 text-left transition-all duration-200",
                            selected
                              ? "border-blue-200 bg-blue-200/5"
                              : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30",
                          )}
                        >
                          {/* Flag */}
                          <span className="text-3xl">{r.flag}</span>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">
                                {r.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {r.subtitle}
                              </span>
                              {r.recommended && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0 bg-brand/10 text-[--brand] border-[--brand]/20"
                                >
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {r.note}
                            </p>
                          </div>

                          {/* Latency */}
                          <div className="shrink-0 text-right">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {r.latency}
                            </div>
                          </div>

                          {/* Selected indicator */}
                          <div
                            className={cn(
                              "absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                              selected
                                ? "border-[--brand] bg-brand"
                                : "border-border group-hover:border-foreground/30",
                            )}
                          >
                            {selected && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      // className="h-10 gap-2 bg-brand px-6 text-white hover:bg-brand-hover"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="h-10 gap-1.5"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Review ── */}
              {step === 3 && (
                <div className="space-y-8 animate-in fade-in-0 slide-in-from-right-4 duration-300">
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Step 3 of 3
                    </p>
                    <h2 className="text-2xl font-semibold text-foreground">
                      Review & create
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Everything look right? Your project will be live in
                      seconds.
                    </p>
                  </div>

                  {/* Hidden form fields */}
                  <input type="hidden" name="name" value={name} />
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="region" value={region} />

                  {/* Summary */}
                  <Card>
                    <CardHeader className="pb-3 border-b">
                      <CardTitle className="text-sm font-semibold">
                        Project configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-border p-0">
                      {[
                        {
                          label: "Name",
                          value: <span className="text-sm">{name}</span>,
                        },
                        {
                          label: "Slug",
                          value: (
                            <code className="rounded bg-muted px-2 py-0.5 font-mono text-sm">
                              {slug}
                            </code>
                          ),
                        },
                        {
                          label: "Region",
                          value: (() => {
                            const r = REGIONS.find((x) => x.id === region)!;
                            return (
                              <div className="flex items-center gap-2">
                                <span>{r.flag}</span>
                                <span className="text-sm">{r.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {r.latency}
                                </span>
                              </div>
                            );
                          })(),
                        },
                        {
                          label: "Plan",
                          value: <Badge variant="secondary">Free tier</Badge>,
                        },
                        {
                          label: "Modules",
                          value: (
                            <div className="flex flex-wrap gap-1.5">
                              {MODULES.map((mod) => {
                                const Icon = mod.icon;
                                return (
                                  <span
                                    key={mod.id}
                                    className="flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                                  >
                                    <Icon
                                      className={cn("h-2.5 w-2.5", mod.color)}
                                    />
                                    {mod.label}
                                  </span>
                                );
                              })}
                            </div>
                          ),
                        },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className="flex items-start gap-6 px-5 py-4"
                        >
                          <span className="w-16 shrink-0 pt-0.5 text-xs text-muted-foreground">
                            {label}
                          </span>
                          <div className="flex-1">{value}</div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* What gets provisioned */}
                  <div className="rounded-xl border border-border bg-muted/20 p-5">
                    <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      What gets provisioned
                    </p>
                    <ul className="space-y-3">
                      {[
                        {
                          icon: Server,
                          label: "Isolated PostgreSQL schema",
                          sub: "with pgvector extension",
                        },
                        {
                          icon: Layers,
                          label: "MongoDB database",
                          sub: "documents + key-value store",
                        },
                        {
                          icon: HardDrive,
                          label: "MinIO storage bucket",
                          sub: "S3-compatible presigned URLs",
                        },
                        {
                          icon: ShieldCheck,
                          label: "Per-project auth system",
                          sub: "JWT + OAuth + refresh tokens",
                        },
                        {
                          icon: Globe,
                          label: "API keys generated",
                          sub: "anon key + service key",
                        },
                      ].map(({ icon: Icon, label, sub }) => (
                        <li key={label} className="flex items-center gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {label}
                            </span>
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              {sub}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <SubmitButton disabled={!canSubmit} />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="h-10 gap-1.5"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
