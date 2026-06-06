// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/database/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
import { getSqlTables, getSqlRows } from "@/lib/api/sql-client";
import { DatabaseClient } from "@/components/database/DatabaseClient";
import { AlertCircle, Database } from "lucide-react";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
  searchParams: Promise<{ table?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `SQL Database · ${projectId}` };
}

export default async function DatabasePage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const { table: initialTableParam } = await searchParams;

  // Fetch project to get the db_schema
  let dbSchema = "";
  try {
    const project = await getProjectById(projectId);
    dbSchema = (project as any).db_schema ?? "";
    console.log("Fetched project:", project);
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
        <p className="text-sm">Database schema not configured for this project.</p>
      </div>
    );
  }

  // Fetch tables list
  let tables: Awaited<ReturnType<typeof getSqlTables>> = [];
  let tablesError: string | null = null;
  try {
    tables = await getSqlTables(projectId, dbSchema);
  } catch (err: any) {
    tablesError = err?.message ?? "Failed to load tables";
  }

  // Determine initial active table
  const initialTable =
    initialTableParam ??
    (tables.find((t) => t.name !== "_auth_users")?.name ?? tables[0]?.name ?? null);

  // Fetch initial rows if we have a table
  let initialResult = null;
  if (initialTable && !tablesError) {
    try {
      initialResult = await getSqlRows(projectId, dbSchema, initialTable, {
        limit: 50,
        orderDir: "desc",
      });
    } catch {
      // Non-fatal — the client will show empty state
    }
  }

  if (tablesError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-6">
        <AlertCircle className="h-8 w-8 text-destructive/70" />
        <p className="text-sm font-medium text-foreground">Could not load database</p>
        <p className="text-xs text-center max-w-xs font-mono bg-muted px-3 py-2 rounded-md">
          {tablesError}
        </p>
        <p className="text-xs text-muted-foreground">
          Make sure the backend is running and the project database is provisioned.
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