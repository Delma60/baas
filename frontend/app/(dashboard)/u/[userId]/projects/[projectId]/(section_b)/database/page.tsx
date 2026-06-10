// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/database/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
import { getSqlTables, getSqlRows } from "@/lib/api/sql-client";
import { DatabaseClient } from "@/components/database/DatabaseClient";
import { CreateDatabaseButton } from "@/components/database/CreateDatabaseButton";
import { getDbStatus } from "@/lib/actions/provision-actions";
import {
  AlertCircle,
  Database,
  ShieldCheck,
  Zap,
  Search,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
  searchParams: Promise<{ table?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `SQL Database · ${projectId}` };
}

// ─── Not-provisioned UI (server component) ───────────────────────────────────

function DatabaseNotProvisioned({
  projectId,
  userId,
  dbSchema,
}: {
  projectId: string;
  userId: string;
  dbSchema: string;
}) {
  const FEATURES = [
    {
      icon: Database,
      title: "Relational tables",
      desc: "Create tables with typed columns, foreign keys, and indexes via the dashboard or SQL.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Search,
      title: "Full-text & vector search",
      desc: "pgvector extension included — build AI-powered similarity search out of the box.",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      icon: ShieldCheck,
      title: "Row-level security",
      desc: "Restrict reads and writes per user with simple JSON permission rules — no raw SQL.",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Zap,
      title: "REST & SDK access",
      desc: "Query your data instantly via the auto-generated REST API or JS/Python SDK.",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-bg3 px-6 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
            <Database className="h-8 w-8 text-text-secondary" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">
            Create your SQL database
          </h1>
          <p className="mt-2 text-[15px] text-text-secondary max-w-md mx-auto">
            Your project doesn&apos;t have a database yet. Provisioning takes
            about 2 seconds and sets up an isolated PostgreSQL schema with
            pgvector.
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Badge
              variant="outline"
              className="font-mono text-[11px] text-text-muted"
            >
              schema: {dbSchema}
            </Badge>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="flex gap-3 rounded-xl border border-border bg-background p-4 shadow-sm"
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.bg}`}
                >
                  <Icon className={`h-4 w-4 ${f.color}`} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">
                    {f.title}
                  </p>
                  <p className="mt-0.5 text-[12px] text-text-secondary leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <CreateDatabaseButton projectId={projectId} userId={userId} />
          <p className="text-[11px] text-text-muted">
            Free tier · No credit card required · Provisions in ~2s
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DatabasePage({ params, searchParams }: Props) {
  const { userId, projectId } = await params;
  const { table: initialTableParam } = await searchParams;

  // 1. Fetch project metadata
  let dbSchema = "";
  try {
    const project = await getProjectById(projectId);
    console.log(project);
    dbSchema = (project as any).db_schema ?? "";
  } catch {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm font-medium">Project not found</p>
      </div>
    );
  }

  if (!dbSchema) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <Database className="h-8 w-8 opacity-30" />
        <p className="text-sm">
          Database schema not configured for this project.
        </p>
      </div>
    );
  }

  // 2. Check if the database has been provisioned
  const dbStatus = await getDbStatus(projectId);
  const isProvisioned = dbStatus?.db_provisioned ?? false;

  // 3. If not provisioned, show the create UI
  if (!isProvisioned) {
    return (
      <DatabaseNotProvisioned
        projectId={projectId}
        userId={userId}
        dbSchema={dbSchema}
      />
    );
  }

  // 4. Database exists — load tables and show the explorer
  let tables: Awaited<ReturnType<typeof getSqlTables>> = [];
  let tablesError: string | null = null;
  try {
    tables = await getSqlTables(projectId, dbSchema);
  } catch (err: any) {
    tablesError = err?.message ?? "Failed to load tables";
  }

  const initialTable =
    initialTableParam ??
    tables.find((t) => t.name !== "_auth_users")?.name ??
    tables[0]?.name ??
    null;

  let initialResult = null;
  if (initialTable && !tablesError) {
    try {
      initialResult = await getSqlRows(projectId, dbSchema, initialTable, {
        limit: 50,
        orderDir: "desc",
      });
    } catch {
      // Non-fatal
    }
  }

  if (tablesError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-6">
        <AlertCircle className="h-8 w-8 text-destructive/70" />
        <p className="text-sm font-medium text-foreground">
          Could not load database
        </p>
        <p className="text-xs text-center max-w-xs font-mono bg-muted px-3 py-2 rounded-md">
          {tablesError}
        </p>
      </div>
    );
  }

  return (
    <DatabaseClient
      projectId={projectId}
      dbSchema={dbSchema}
      initialTables={tables}
      initialTable={initialTable}
      initialResult={initialResult}
    />
  );
}
