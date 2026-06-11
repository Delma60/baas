// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/docs/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  Database,
  Layers,
  HardDrive,
  ShieldCheck,
  Radio,
  Zap,
  KeyRound,
  Sparkles,
  ArrowRight,
  BookOpen,
  Terminal,
  Code2,
} from "lucide-react";
import { APP_NAME } from "@/lib/utils/constants";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Documentation · ${APP_NAME}` };
}

const MODULES = [
  {
    slug: "sql",
    icon: Database,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    title: "SQL Database",
    desc: "Relational data with tables, rows, foreign keys, full-text search, and vector search for AI workloads.",
    tags: ["REST API", "SDK"],
  },
  {
    slug: "nosql",
    icon: Layers,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    title: "NoSQL / Documents",
    desc: "Flexible document storage. Insert, query, aggregate, and run pipelines against any collection.",
    tags: ["REST API", "SDK"],
  },
  {
    slug: "kv",
    icon: KeyRound,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    title: "Key-Value Store",
    desc: "Lightning-fast key-value operations. TTL support, batch operations, and prefix-based listing.",
    tags: ["REST API", "SDK"],
  },
  {
    slug: "storage",
    icon: HardDrive,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    title: "Storage",
    desc: "Self-hosted object storage. Presigned upload/download URLs, bucket management, and file listing.",
    tags: ["REST API", "SDK"],
  },
  {
    slug: "auth",
    icon: ShieldCheck,
    color: "bg-red-500/10 text-red-600 dark:text-red-400",
    title: "Authentication",
    desc: "Per-project user auth with email/password, magic links, and OAuth. JWT sessions, sign-up, sign-in, and refresh.",
    tags: ["REST API", "SDK"],
  },
  {
    slug: "realtime",
    icon: Radio,
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    title: "Realtime",
    desc: "Subscribe to live database changes in real time. SQL and NoSQL change streams power instant updates.",
    tags: ["WebSocket", "SDK"],
  },
  {
    slug: "functions",
    icon: Zap,
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    title: "Edge Functions",
    desc: "Invoke serverless functions with a JSON payload. Trigger via HTTP, schedule, or database events.",
    tags: ["REST API", "SDK"],
  },
];

const QUICKSTARTS = [
  {
    lang: "JavaScript",
    icon: "JS",
    slug: "quickstart-js",
    color: "bg-yellow-400 text-yellow-900",
  },
  {
    lang: "TypeScript",
    icon: "TS",
    slug: "quickstart-ts",
    color: "bg-blue-500 text-white",
  },
  {
    lang: "Python",
    icon: "PY",
    slug: "quickstart-python",
    color: "bg-emerald-500 text-white",
  },
];

export default async function DocsIndexPage({ params }: Props) {
  const { userId, projectId } = await params;
  const base = `/docs`;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-brand" />
          <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
            Documentation
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-text-primary mb-2">
          {APP_NAME} Reference
        </h1>
        <p className="text-text-secondary text-[15px] max-w-xl leading-relaxed">
          Everything you need to integrate SQL, NoSQL, storage, auth, realtime,
          and edge functions into your app. Pick a module or language to get
          started.
        </p>
      </div>

      {/* Quickstarts */}
      <section className="mb-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-3">
          Quickstart
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICKSTARTS.map((q) => (
            <Link
              key={q.slug}
              href={`${base}/${q.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 hover:border-brand/40 hover:shadow-sm transition-all group"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${q.color}`}
              >
                {q.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">
                  {q.lang}
                </p>
                <p className="text-xs text-text-muted">Get started in 5 min</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-text-muted group-hover:text-brand transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="mb-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-3">
          Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.slug}
                href={`${base}/${mod.slug}`}
                className="flex items-start gap-4 rounded-xl border border-border bg-background p-4 hover:border-brand/40 hover:shadow-sm transition-all group"
              >
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${mod.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text-primary">
                      {mod.title}
                    </p>
                    <ArrowRight className="h-3.5 w-3.5 text-text-muted group-hover:text-brand transition-colors" />
                  </div>
                  <p className="mt-1 text-[13px] text-text-secondary leading-relaxed">
                    {mod.desc}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {mod.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-text-muted border border-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bottom links */}
      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted mb-3">
          More
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`${base}/api-reference`}
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 hover:border-brand/40 hover:shadow-sm transition-all group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface">
              <Terminal className="h-4 w-4 text-text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                REST API Reference
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                All endpoints, params, and response shapes
              </p>
            </div>
          </Link>
          <Link
            href={`${base}/sdk`}
            className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 hover:border-brand/40 hover:shadow-sm transition-all group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface">
              <Code2 className="h-4 w-4 text-text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                SDK Reference
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                JS/TS and Python SDK method signatures
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
