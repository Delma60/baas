// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/docs/sql/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
import { getSqlTables } from "@/lib/api/sql-client";
import {
  DocPage,
  DocSection,
  DocSubSection,
  DocP,
  DocCode,
  DocTabs,
  DocAlert,
  DocTable,
} from "@/components/docs/DocPage";

export const metadata: Metadata = { title: "SQL Database · Docs · YourBaaS" };

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function SqlDocsPage({ params }: Props) {
  const { projectId } = await params;

  let dbSchema = "";
  let tableNames: string[] = [];
  try {
    const project = await getProjectById(projectId);
    dbSchema = project.db_schema;
    if (dbSchema) {
      const tables = await getSqlTables(projectId, dbSchema).catch(() => []);
      tableNames = tables.map((t) => t.name).filter((n) => !n.startsWith("_"));
    }
  } catch {}

  const exampleTable = tableNames[0] ?? "posts";

  return (
    <DocPage
      title="SQL Database"
      description="Relational data with tables, queries, row management, and vector search for AI-powered similarity matching — all via a REST API or SDK."
      badge="SQL + vector"
      badgeColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      toc={[
        { id: "setup", label: "Setup" },
        { id: "install-sdk", label: "Install SDK", level: 3 },
        { id: "init", label: "Initialize client", level: 3 },
        { id: "crud", label: "CRUD Operations" },
        { id: "query", label: "Query rows", level: 3 },
        { id: "insert", label: "Insert rows", level: 3 },
        { id: "update", label: "Update rows", level: 3 },
        { id: "delete", label: "Delete rows", level: 3 },
        { id: "filtering", label: "Filtering & Ordering" },
        { id: "rpc", label: "RPC / DB Functions" },
        { id: "rest-api", label: "REST API" },
        { id: "schema", label: "Your Schema" },
      ]}
    >
      {/* Setup */}
      <DocSection id="setup" title="Setup">
        <DocSubSection id="install-sdk" title="Install the SDK">
          <DocTabs
            tabs={[
              {
                label: "npm",
                lang: "bash",
                code: `npm install @yourbaas/sdk`,
              },
              {
                label: "yarn",
                lang: "bash",
                code: `yarn add @yourbaas/sdk`,
              },
              {
                label: "pip",
                lang: "bash",
                code: `pip install yourbaas`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="init" title="Initialize the client">
          <DocP>
            Get your project API keys from <strong>Settings → API Keys</strong>.
            Use the{" "}
            <code className="text-brand bg-brand/10 px-1 rounded text-xs">
              anon
            </code>{" "}
            key for client-side code.
          </DocP>
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `import { BaasClient } from "@yourbaas/sdk"

const baas = new BaasClient({
  projectId: "${projectId}",
  apiKey: "sk_anon_...",
})`,
              },
              {
                label: "Python",
                lang: "python",
                code: `from baas import BaasClient

baas = BaasClient(
    project_id="${projectId}",
    api_key="sk_anon_...",
)`,
              },
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* CRUD */}
      <DocSection id="crud" title="CRUD Operations">
        <DocSubSection id="query" title="Query rows">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `const { data, meta } = await baas.db("${exampleTable}")
  .select("id, title, created_at")
  .filter("status", "eq", "published")
  .order("created_at", "desc")
  .limit(20)
  .execute()

console.log(data)       // Row[]
console.log(meta.count) // total matching rows`,
              },
              {
                label: "Python",
                lang: "python",
                code: `result = await baas.db("${exampleTable}") \\
    .select("id, title, created_at") \\
    .filter("status", "eq", "published") \\
    .order("created_at", "desc") \\
    .limit(20) \\
    .execute()

print(result.data)  # list of dicts
print(result.count) # total matching rows`,
              },
              {
                label: "curl",
                lang: "bash",
                code: `curl "${process.env.NEXT_PUBLIC_APP_URL ?? "https://api.yourbaas.com"}/v1/db/${projectId}/${exampleTable}?select=id,title&filter=status:eq:published&order=created_at&order_dir=desc&limit=20" \\
  -H "Authorization: Bearer sk_anon_..."`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="insert" title="Insert rows">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `const row = await baas.db("${exampleTable}").insert({
  title: "Hello world",
  status: "draft",
  user_id: "user_abc123",
})`,
              },
              {
                label: "Python",
                lang: "python",
                code: `row = await baas.db("${exampleTable}").insert({
    "title": "Hello world",
    "status": "draft",
    "user_id": "user_abc123",
})`,
              },
              {
                label: "curl",
                lang: "bash",
                code: `curl -X POST "${process.env.NEXT_PUBLIC_APP_URL ?? "https://api.yourbaas.com"}/v1/db/${projectId}/${exampleTable}" \\
  -H "Authorization: Bearer sk_anon_..." \\
  -H "Content-Type: application/json" \\
  -d '{"data": {"title": "Hello world", "status": "draft"}}'`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="update" title="Update rows">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `const updated = await baas.db("${exampleTable}").update("row-id-123", {
  status: "published",
})`,
              },
              {
                label: "Python",
                lang: "python",
                code: `updated = await baas.db("${exampleTable}").update("row-id-123", {
    "status": "published",
})`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="delete" title="Delete rows">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `const result = await baas.db("${exampleTable}").delete("row-id-123")
// result.deleted === true`,
              },
              {
                label: "Python",
                lang: "python",
                code: `result = await baas.db("${exampleTable}").delete("row-id-123")
# result["deleted"] == True`,
              },
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* Filtering */}
      <DocSection id="filtering" title="Filtering & Ordering">
        <DocP>
          Chain{" "}
          <code className="text-brand bg-brand/10 px-1 rounded text-xs">
            .filter()
          </code>{" "}
          multiple times to AND conditions together. Use{" "}
          <code className="text-brand bg-brand/10 px-1 rounded text-xs">
            .order()
          </code>{" "}
          to sort results.
        </DocP>
        <DocTable
          headers={["Operator", "SQL equivalent", "Example"]}
          rows={[
            ["eq", "=", `.filter("status", "eq", "active")`],
            ["neq", "!=", `.filter("role", "neq", "admin")`],
            ["gt", ">", `.filter("views", "gt", 100)`],
            ["gte", ">=", `.filter("views", "gte", 100)`],
            ["lt", "<", `.filter("age", "lt", 18)`],
            ["lte", "<=", `.filter("price", "lte", 50)`],
            ["like", "LIKE", `.filter("name", "like", "%john%")`],
            ["ilike", "ILIKE", `.filter("email", "ilike", "%@gmail.com")`],
            ["in", "IN", `.filter("id", "in", ["a", "b", "c"])`],
            [
              "is",
              "IS NULL / IS NOT NULL",
              `.filter("deleted_at", "is", null)`,
            ],
          ]}
        />
      </DocSection>

      {/* RPC */}
      <DocSection id="rpc" title="RPC / Database Functions">
        <DocP>
          Call database functions defined in your project schema. Useful for
          complex queries, aggregations, or stored business logic.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const results = await baas.db.rpc("search_posts").call({
  query: "hello world",
  limit: 10,
})`,
            },
            {
              label: "Python",
              lang: "python",
              code: `results = await baas.db.rpc("search_posts") \\
    .args(query="hello world", limit=10) \\
    .execute()`,
            },
          ]}
        />
      </DocSection>

      {/* REST API */}
      <DocSection id="rest-api" title="REST API">
        <DocTable
          headers={["Method", "Path", "Description"]}
          rows={[
            [
              "GET",
              `/v1/db/${projectId}/{table}`,
              "List rows (filter, order, limit, offset)",
            ],
            [
              "GET",
              `/v1/db/${projectId}/{table}/{id}`,
              "Get a single row by ID",
            ],
            ["POST", `/v1/db/${projectId}/{table}`, "Insert one or more rows"],
            ["PATCH", `/v1/db/${projectId}/{table}/{id}`, "Update a row"],
            ["DELETE", `/v1/db/${projectId}/{table}/{id}`, "Delete a row"],
            [
              "POST",
              `/v1/db/${projectId}/rpc/{fn}`,
              "Call a database function",
            ],
          ]}
        />
      </DocSection>

      {/* Schema */}
      {tableNames.length > 0 && (
        <DocSection id="schema" title="Your Tables">
          <DocP>
            Tables currently in your project&apos;s database schema{" "}
            <code className="text-brand bg-brand/10 px-1 rounded text-xs">
              {dbSchema}
            </code>
            :
          </DocP>
          <div className="flex flex-wrap gap-2">
            {tableNames.map((t) => (
              <span
                key={t}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-[12px] text-text-secondary"
              >
                {t}
              </span>
            ))}
          </div>
          <DocAlert type="info">
            Manage tables and columns in the{" "}
            <a
              href={`/u/${projectId}/projects/${projectId}/database`}
              className="underline font-medium"
            >
              SQL Database
            </a>{" "}
            dashboard.
          </DocAlert>
        </DocSection>
      )}
    </DocPage>
  );
}
