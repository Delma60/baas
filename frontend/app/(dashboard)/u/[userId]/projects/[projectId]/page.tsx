// frontend/app/dashboard/projects/[projectId]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  Database,
  Layers,
  ShieldCheck,
  HardDrive,
  Radio,
  Sparkles,
  Zap,
  ArrowRight,
  Activity,
  KeyRound,
  Settings,
  Copy,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
// import { ApiKeyDisplay } from "@/components/shared/ApiKeyDisplay";
import { PageHeader } from "@/components/shared/PageHeader";
import { ApiKeyDisplay } from "@/components/shared/ApiKeyDisplay";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Project · ${projectId}` };
}

// ─── Mock project data (replace with DB query via Drizzle) ────────────────────

async function getProject(projectId: string) {
  // TODO: replace with actual DB lookup
  return {
    id: projectId,
    name: projectId.startsWith("proj_") ? "my-project" : projectId,
    status: "active" as const,
    region: "Lagos",
    plan: "free",
    dbSchema: `proj_abc123`,
    mongoDatabase: `proj_abc123`,
    anonKey: "sk_anon_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    serviceKey: "sk_service_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    createdAt: new Date(),
    stats: {
      sqlRows: 0,
      nosqlDocs: 0,
      storageUsedMb: 0,
      apiCalls: 0,
      authUsers: 0,
    },
  };
}

// ─── Module cards ─────────────────────────────────────────────────────────────

const MODULES = [
  {
    id: "database",
    label: "SQL Database",
    description: "PostgreSQL tables, REST API, RPC",
    icon: Database,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    href: (id: string) => `/dashboard/projects/${id}/database`,
    stat: (stats: any) => `${stats.sqlRows.toLocaleString()} rows`,
  },
  {
    id: "nosql",
    label: "NoSQL / KV",
    description: "MongoDB collections + key-value store",
    icon: Layers,
    color: "text-green-500",
    bg: "bg-green-500/10",
    href: (id: string) => `/dashboard/projects/${id}/nosql`,
    stat: (stats: any) => `${stats.nosqlDocs.toLocaleString()} docs`,
  },
  {
    id: "auth",
    label: "Auth",
    description: "Users, sessions, JWTs",
    icon: ShieldCheck,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    href: (id: string) => `/dashboard/projects/${id}/auth`,
    stat: (stats: any) => `${stats.authUsers.toLocaleString()} users`,
  },
  {
    id: "storage",
    label: "Storage",
    description: "Self-hosted MinIO file buckets",
    icon: HardDrive,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    href: (id: string) => `/dashboard/projects/${id}/storage`,
    stat: (stats: any) => `${stats.storageUsedMb} MB used`,
  },
  {
    id: "realtime",
    label: "Realtime",
    description: "Postgres NOTIFY + Change Streams",
    icon: Radio,
    color: "text-red-500",
    bg: "bg-red-500/10",
    href: (id: string) => `/dashboard/projects/${id}/realtime`,
    stat: () => "0 active listeners",
  },
  {
    id: "ai",
    label: "AI / Vectors",
    description: "pgvector similarity search",
    icon: Sparkles,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    href: (id: string) => `/dashboard/projects/${id}/ai`,
    stat: () => "0 vectors",
  },
  {
    id: "functions",
    label: "Edge Functions",
    description: "Deploy custom HTTP endpoints",
    icon: Zap,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    href: (id: string) => `/dashboard/projects/${id}/functions`,
    stat: () => "0 functions",
  },
  {
    id: "logs",
    label: "Logs",
    description: "Request logs and errors",
    icon: Activity,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    href: (id: string) => `/dashboard/projects/${id}/logs`,
    stat: () => "0 events",
  },
];

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "API Keys", icon: KeyRound, href: (id: string) => `/dashboard/projects/${id}/settings/api-keys` },
  { label: "Usage", icon: BarChart3, href: (id: string) => `/dashboard/projects/${id}/usage` },
  { label: "Settings", icon: Settings, href: (id: string) => `/dashboard/projects/${id}/settings` },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  return (
    <div>
      <PageHeader
        title={project.name}
        description={`${project.region} · ${project.plan} plan`}
        icon={Database}
        iconColor="orange"
        actions={
          <div className="flex items-center gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href(projectId)}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[--border] bg-[--background] px-3 text-xs font-medium text-[--text-secondary] transition-colors hover:bg-[--surface-hover] hover:text-[--text-primary]"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-6 space-y-8">

        {/* ── Status bar ── */}
        <div className="flex items-center gap-6 rounded-xl border border-[--border] bg-[--background] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-[--text-primary]">Active</span>
          </div>
          <div className="h-4 w-px bg-[--border]" />
          <StatChip label="SQL Rows" value={project.stats.sqlRows.toLocaleString()} />
          <StatChip label="Storage" value={`${project.stats.storageUsedMb} MB`} />
          <StatChip label="API Calls" value={project.stats.apiCalls.toLocaleString()} />
          <StatChip label="Auth Users" value={project.stats.authUsers.toLocaleString()} />
        </div>

        {/* ── API Keys ── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[--text-primary]">API Keys</h2>
            <Link
              href={`/dashboard/projects/${projectId}/settings/api-keys`}
              className="text-xs text-[--brand] hover:underline"
            >
              Manage →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ApiKeyDisplay label="Anon key (public)" keyValue={project.anonKey} type="anon" />
            <ApiKeyDisplay label="Service key (secret)" keyValue={project.serviceKey} type="service" />
          </div>
        </section>

        {/* ── Modules grid ── */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-[--text-primary]">Modules</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.id}
                  href={mod.href(projectId)}
                  className="group flex flex-col gap-3 rounded-xl border border-[--border] bg-[--background] p-4 transition-all hover:border-[--brand]/30 hover:-translate-y-px hover:shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", mod.bg)}>
                      <Icon className={cn("h-4 w-4", mod.color)} />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[--text-muted] opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[--text-primary]">{mod.label}</p>
                    <p className="mt-0.5 text-xs text-[--text-muted]">{mod.description}</p>
                  </div>
                  <p className="text-xs text-[--text-secondary]">{mod.stat(project.stats)}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── SDK quickstart ── */}
        <section className="rounded-xl border border-[--border] bg-[--surface] p-5">
          <h2 className="mb-4 text-sm font-medium text-[--text-primary]">SDK Quickstart</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <CodeBlock
              lang="TypeScript"
              code={`import { BaasClient } from '@yourbaas/sdk'

const baas = new BaasClient({
  projectId: '${projectId}',
  apiKey: 'sk_anon_...',
})`}
            />
            <CodeBlock
              lang="Python"
              code={`from yourbaas import BaasClient

baas = BaasClient(
    project_id="${projectId}",
    api_key="sk_anon_...",
)`}
            />
          </div>
        </section>

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[--text-muted]">{label}</p>
      <p className="text-sm font-medium text-[--text-primary]">{value}</p>
    </div>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[--border] bg-[--code-bg]">
      <div className="flex items-center justify-between border-b border-[--border] px-3 py-2">
        <span className="text-xs font-medium text-[--text-muted]">{lang}</span>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-[--code-text]">
        <code>{code}</code>
      </pre>
    </div>
  );
}