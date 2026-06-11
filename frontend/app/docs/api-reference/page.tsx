// frontend/app/docs/api-reference/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getProjectsByUser } from "@/lib/api/client";
import {
  DocPage,
  DocSection,
  DocSubSection,
  DocP,
  DocAlert,
  DocTable,
  DocTabs,
} from "@/components/docs/DocPage";
import { APP_NAME } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: `REST API Reference · Docs · ${APP_NAME}`,
};

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function ApiReferencePage({ params }: Props) {
  const session = await auth();
  let projectId = "";

  try {
    const { projectId: pid } = await params;
    projectId = pid ?? "";
  } catch {}

  if (!projectId && session?.user?.id) {
    try {
      const projects = await getProjectsByUser(session.user.id);
      if (projects[0]) projectId = projects[0].id;
    } catch {}
  }

  const pid = projectId || "proj_your_project_id";
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://api.yourbaas.com";

  return (
    <DocPage
      title="REST API Reference"
      description="Complete reference for all public /v1/* endpoints. Every request requires a Bearer API key. Write operations (POST, PATCH, DELETE) require a service-role key."
      badge="REST"
      badgeColor="bg-surface text-text-secondary border border-border"
      toc={[
        { id: "auth-header", label: "Authentication" },
        { id: "response-envelope", label: "Response envelope" },
        { id: "errors", label: "Errors" },
        { id: "sql", label: "SQL Database" },
        { id: "nosql", label: "NoSQL Documents" },
        { id: "kv", label: "Key-Value Store" },
        { id: "storage", label: "Storage" },
        { id: "project-auth", label: "Auth" },
        { id: "realtime", label: "Realtime" },
        { id: "functions", label: "Edge Functions" },
        { id: "ai", label: "AI / Vector" },
      ]}
    >
      {/* Auth */}
      <DocSection id="auth-header" title="Authentication">
        <DocP>
          Every request must include an{" "}
          <code className="font-mono text-xs">Authorization</code> header with a
          Bearer API key scoped to your project.
        </DocP>
        <DocTable
          headers={["Key type", "Use case"]}
          rows={[
            [
              "anon",
              "Client-side code, read operations, user-facing auth flows",
            ],
            [
              "service",
              "Server-side code only — INSERT, PATCH, DELETE, function invocations",
            ],
          ]}
        />
        <DocTabs
          tabs={[
            {
              label: "curl",
              lang: "bash",
              code: `curl "${base}/v1/db/${pid}/posts" \\
  -H "Authorization: Bearer sk_anon_..."`,
            },
          ]}
        />
        <DocAlert type="warning">
          Never expose a service-role key in browser or mobile code. Use it only
          in server-side environments.
        </DocAlert>
      </DocSection>

      {/* Response envelope */}
      <DocSection id="response-envelope" title="Response envelope">
        <DocP>
          All responses are wrapped in a consistent JSON envelope.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "Success",
              lang: "json",
              code: `{
  "data": [ ... ],       // the payload — array or object
  "meta": {
    "count": 42,         // total matching rows (list endpoints)
    "limit": 20,
    "offset": 0
  }
}`,
            },
            {
              label: "Error",
              lang: "json",
              code: `{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Authentication required",
    "details": {}
  }
}`,
            },
          ]}
        />
      </DocSection>

      {/* Errors */}
      <DocSection id="errors" title="HTTP status codes">
        <DocTable
          headers={["Status", "Meaning"]}
          rows={[
            ["200 / 201", "Success"],
            ["400", "Validation error — check request body or query params"],
            ["401", "Missing or invalid API key"],
            ["403", "Insufficient key type (anon used where service required)"],
            ["404", "Resource not found"],
            ["409", "Conflict — duplicate email, slug, etc."],
            ["429", "Rate limit exceeded — check Retry-After header"],
            ["500", "Internal server error"],
          ]}
        />
      </DocSection>

      {/* SQL */}
      <DocSection id="sql" title="SQL Database">
        <DocP>
          All SQL endpoints are scoped to your project. Tables live in a
          dedicated PostgreSQL schema provisioned at project creation.
        </DocP>

        <DocSubSection id="sql-list" title="List rows">
          <DocTable
            headers={["", ""]}
            rows={[
              ["Method", "GET"],
              ["Path", `/v1/db/${pid}/{table}`],
              ["Auth", "anon or service"],
            ]}
          />
          <DocTable
            headers={["Query param", "Type", "Description"]}
            rows={[
              ["select", "string", "Comma-separated columns. Default: *"],
              [
                "filter",
                "string",
                "col:op:value,… — e.g. status:eq:published",
              ],
              ["order", "string", "Column name to sort by"],
              ["order_dir", "asc | desc", "Sort direction. Default: asc"],
              ["limit", "integer", "Max rows (1–1000). Default: 100"],
              ["offset", "integer", "Rows to skip. Default: 0"],
            ]}
          />
          <DocTabs
            tabs={[
              {
                label: "curl",
                lang: "bash",
                code: `curl "${base}/v1/db/${pid}/posts?select=id,title&filter=status:eq:published&order=created_at&order_dir=desc&limit=20" \\
  -H "Authorization: Bearer sk_anon_..."`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="sql-get" title="Get single row">
          <DocTable
            headers={["", ""]}
            rows={[
              ["Method", "GET"],
              ["Path", `/v1/db/${pid}/{table}/{id}`],
              ["Auth", "anon or service"],
            ]}
          />
          <DocTabs
            tabs={[
              {
                label: "curl",
                lang: "bash",
                code: `curl "${base}/v1/db/${pid}/posts/row-id-123" \\
  -H "Authorization: Bearer sk_anon_..."`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="sql-insert" title="Insert row(s)">
          <DocTable
            headers={["", ""]}
            rows={[
              ["Method", "POST"],
              ["Path", `/v1/db/${pid}/{table}`],
              ["Auth", "service only"],
            ]}
          />
          <DocTabs
            tabs={[
              {
                label: "Single row",
                lang: "bash",
                code: `curl -X POST "${base}/v1/db/${pid}/posts" \\
  -H "Authorization: Bearer sk_service_..." \\
  -H "Content-Type: application/json" \\
  -d '{"data": {"title": "Hello", "status": "draft"}}'`,
              },
              {
                label: "Bulk insert",
                lang: "bash",
                code: `curl -X POST "${base}/v1/db/${pid}/posts" \\
  -H "Authorization: Bearer sk_service_..." \\
  -H "Content-Type: application/json" \\
  -d '{"data": [{"title": "A"}, {"title": "B"}]}'`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="sql-update" title="Update row">
          <DocTable
            headers={["", ""]}
            rows={[
              ["Method", "PATCH"],
              ["Path", `/v1/db/${pid}/{table}/{id}`],
              ["Auth", "service only"],
            ]}
          />
          <DocTabs
            tabs={[
              {
                label: "curl",
                lang: "bash",
                code: `curl -X PATCH "${base}/v1/db/${pid}/posts/row-id-123" \\
  -H "Authorization: Bearer sk_service_..." \\
  -H "Content-Type: application/json" \\
  -d '{"data": {"status": "published"}}'`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="sql-delete" title="Delete row">
          <DocTable
            headers={["", ""]}
            rows={[
              ["Method", "DELETE"],
              ["Path", `/v1/db/${pid}/{table}/{id}`],
              ["Auth", "service only"],
            ]}
          />
        </DocSubSection>

        <DocSubSection id="sql-rpc" title="RPC / database functions">
          <DocTable
            headers={["", ""]}
            rows={[
              ["Method", "POST"],
              ["Path", `/v1/db/${pid}/rpc/{fn_name}`],
              ["Auth", "service only"],
            ]}
          />
          <DocTabs
            tabs={[
              {
                label: "curl",
                lang: "bash",
                code: `curl -X POST "${base}/v1/db/${pid}/rpc/search_posts" \\
  -H "Authorization: Bearer sk_service_..." \\
  -H "Content-Type: application/json" \\
  -d '{"args": {"query": "hello", "limit": 10}}'`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="sql-filter-ops" title="Filter operators">
          <DocTable
            headers={["Operator", "SQL equivalent", "Example"]}
            rows={[
              ["eq", "=", "status:eq:published"],
              ["neq", "!=", "role:neq:admin"],
              ["gt", ">", "views:gt:100"],
              ["gte", ">=", "views:gte:100"],
              ["lt", "<", "age:lt:18"],
              ["lte", "<=", "price:lte:50"],
              ["like", "LIKE", "name:like:%john%"],
              ["ilike", "ILIKE", "email:ilike:%@gmail.com"],
              ["in", "IN", "id:in:a|b|c  (pipe-delimited list)"],
              ["is", "IS NULL", "deleted_at:is:null"],
            ]}
          />
        </DocSubSection>
      </DocSection>

      {/* NoSQL */}
      <DocSection id="nosql" title="NoSQL Documents">
        <DocTable
          headers={["Method", "Path", "Auth", "Description"]}
          rows={[
            [
              "GET",
              `/v1/nosql/${pid}/collections/{name}`,
              "anon",
              "Find documents (sort, limit, skip)",
            ],
            [
              "GET",
              `/v1/nosql/${pid}/collections/{name}/{id}`,
              "anon",
              "Get document by ID",
            ],
            [
              "POST",
              `/v1/nosql/${pid}/collections/{name}`,
              "service",
              "Insert one or many documents",
            ],
            [
              "PATCH",
              `/v1/nosql/${pid}/collections/{name}/{id}`,
              "service",
              "Update document (MongoDB operators)",
            ],
            [
              "DELETE",
              `/v1/nosql/${pid}/collections/{name}/{id}`,
              "service",
              "Delete document",
            ],
            [
              "POST",
              `/v1/nosql/${pid}/collections/{name}/aggregate`,
              "service",
              "Run aggregation pipeline",
            ],
          ]}
        />
        <DocTabs
          tabs={[
            {
              label: "Find",
              lang: "bash",
              code: `curl "${base}/v1/nosql/${pid}/collections/articles?limit=10&sort_field=createdAt&sort_dir=-1" \\
  -H "Authorization: Bearer sk_anon_..."`,
            },
            {
              label: "Insert",
              lang: "bash",
              code: `curl -X POST "${base}/v1/nosql/${pid}/collections/articles" \\
  -H "Authorization: Bearer sk_service_..." \\
  -H "Content-Type: application/json" \\
  -d '{"data": {"title": "Hello", "status": "draft"}}'`,
            },
            {
              label: "Aggregate",
              lang: "bash",
              code: `curl -X POST "${base}/v1/nosql/${pid}/collections/orders/aggregate" \\
  -H "Authorization: Bearer sk_service_..." \\
  -H "Content-Type: application/json" \\
  -d '{"pipeline": [{"$match": {"status": "paid"}}, {"$group": {"_id": "$userId", "total": {"$sum": "$amount"}}}]}'`,
            },
          ]}
        />
      </DocSection>

      {/* KV */}
      <DocSection id="kv" title="Key-Value Store">
        <DocTable
          headers={["Method", "Path", "Auth", "Description"]}
          rows={[
            [
              "GET",
              `/v1/nosql/${pid}/kv/{key}`,
              "anon",
              "Get value by key",
            ],
            [
              "PUT",
              `/v1/nosql/${pid}/kv/{key}`,
              "service",
              "Set value (upsert). Body: { value, ttl? }",
            ],
            [
              "DELETE",
              `/v1/nosql/${pid}/kv/{key}`,
              "service",
              "Delete key",
            ],
            [
              "GET",
              `/v1/nosql/${pid}/kv?prefix=`,
              "anon",
              "List keys with optional prefix filter",
            ],
            [
              "POST",
              `/v1/nosql/${pid}/kv/batch`,
              "service",
              "Batch get/set/delete",
            ],
          ]}
        />
        <DocTabs
          tabs={[
            {
              label: "Set with TTL",
              lang: "bash",
              code: `curl -X PUT "${base}/v1/nosql/${pid}/kv/session:abc123" \\
  -H "Authorization: Bearer sk_service_..." \\
  -H "Content-Type: application/json" \\
  -d '{"value": {"userId": "user_123"}, "ttl": 3600}'`,
            },
            {
              label: "Batch",
              lang: "bash",
              code: `curl -X POST "${base}/v1/nosql/${pid}/kv/batch" \\
  -H "Authorization: Bearer sk_service_..." \\
  -H "Content-Type: application/json" \\
  -d '{"operations": [{"op": "set", "key": "a", "value": 1}, {"op": "get", "key": "b"}]}'`,
            },
          ]}
        />
      </DocSection>

      {/* Storage */}
      <DocSection id="storage" title="Storage">
        <DocTable
          headers={["Method", "Path", "Auth", "Description"]}
          rows={[
            [
              "POST",
              `/v1/storage/${pid}/{bucket}/upload`,
              "anon",
              "Get presigned PUT URL. Body: { filename, content_type, expires_in? }",
            ],
            [
              "GET",
              `/v1/storage/${pid}/{bucket}/files`,
              "anon",
              "List files. Params: prefix, limit",
            ],
            [
              "DELETE",
              `/v1/storage/${pid}/{bucket}/{path}`,
              "service",
              "Delete a file by key/path",
            ],
            [
              "GET",
              `/v1/storage/${pid}/{bucket}/{path}/url`,
              "anon",
              "Get presigned download URL. Params: expires_in",
            ],
          ]}
        />
        <DocAlert type="info">
          Files are never proxied through the API — upload/download URLs point
          directly to MinIO storage. Always use the presigned URL workflow.
        </DocAlert>
        <DocTabs
          tabs={[
            {
              label: "Get upload URL",
              lang: "bash",
              code: `# Step 1 — get presigned URL
curl -X POST "${base}/v1/storage/${pid}/avatars/upload" \\
  -H "Authorization: Bearer sk_anon_..." \\
  -H "Content-Type: application/json" \\
  -d '{"filename": "profile.jpg", "content_type": "image/jpeg"}'

# Step 2 — PUT file directly to the returned upload_url
curl -X PUT "https://storage.yourbaas.com/..." \\
  -H "Content-Type: image/jpeg" \\
  --data-binary @profile.jpg`,
            },
          ]}
        />
      </DocSection>

      {/* Auth */}
      <DocSection id="project-auth" title="Auth">
        <DocTable
          headers={["Method", "Path", "Auth", "Description"]}
          rows={[
            [
              "POST",
              `/v1/auth/${pid}/signup`,
              "anon",
              "Register a new user. Returns session + JWT.",
            ],
            [
              "POST",
              `/v1/auth/${pid}/signin`,
              "anon",
              "Sign in with email + password.",
            ],
            [
              "POST",
              `/v1/auth/${pid}/signout`,
              "anon",
              "Invalidate current session.",
            ],
            [
              "POST",
              `/v1/auth/${pid}/refresh`,
              "anon",
              "Exchange refresh token for new access token.",
            ],
            [
              "GET",
              `/v1/auth/${pid}/me`,
              "anon + X-User-Token",
              "Get authenticated user profile.",
            ],
          ]}
        />
        <DocP>
          After sign-in, pass the access token as{" "}
          <code className="font-mono text-xs">X-User-Token</code> on subsequent
          requests so permission rules can evaluate{" "}
          <code className="font-mono text-xs">auth.uid()</code> conditions.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "Sign in",
              lang: "bash",
              code: `curl -X POST "${base}/v1/auth/${pid}/signin" \\
  -H "Authorization: Bearer sk_anon_..." \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "password123"}'`,
            },
            {
              label: "Authenticated request",
              lang: "bash",
              code: `# Use X-User-Token so the permission engine can check auth.uid()
curl "${base}/v1/db/${pid}/posts" \\
  -H "Authorization: Bearer sk_anon_..." \\
  -H "X-User-Token: <access_token_from_signin>"`,
            },
          ]}
        />
      </DocSection>

      {/* Realtime */}
      <DocSection id="realtime" title="Realtime">
        <DocTable
          headers={["Method", "Path", "Auth", "Description"]}
          rows={[
            [
              "GET",
              `/v1/realtime/${pid}/channels`,
              "anon",
              "List available channels for this project.",
            ],
            [
              "POST",
              `/v1/realtime/${pid}/subscribe`,
              "anon",
              "Register a subscription. Returns channel name + Socket.io connection info.",
            ],
          ]}
        />
        <DocAlert type="info">
          The SDK handles channel registration automatically. The Socket.io
          connection opens on the first <code>.on()</code> call.
        </DocAlert>
      </DocSection>

      {/* Functions */}
      <DocSection id="functions" title="Edge Functions">
        <DocTable
          headers={["Method", "Path", "Auth", "Description"]}
          rows={[
            [
              "POST",
              `/v1/functions/${pid}/invoke/{name}`,
              "anon or service",
              "Invoke a named edge function. Body: { payload, headers? }",
            ],
          ]}
        />
        <DocTabs
          tabs={[
            {
              label: "curl",
              lang: "bash",
              code: `curl -X POST "${base}/v1/functions/${pid}/invoke/send-welcome-email" \\
  -H "Authorization: Bearer sk_anon_..." \\
  -H "Content-Type: application/json" \\
  -d '{"payload": {"userId": "user_123", "template": "welcome"}}'`,
            },
          ]}
        />
      </DocSection>

      {/* AI / Vector */}
      <DocSection id="ai" title="AI / Vector">
        <DocTable
          headers={["Method", "Path", "Auth", "Description"]}
          rows={[
            [
              "POST",
              `/v1/ai/${pid}/embed`,
              "service",
              "Generate a text embedding via OpenAI. Body: { text, model? }",
            ],
            [
              "POST",
              `/v1/ai/${pid}/vectors/{table}/upsert`,
              "service",
              "Insert or update an embedding. Body: { id, embedding, metadata? }",
            ],
            [
              "POST",
              `/v1/ai/${pid}/vectors/{table}/search`,
              "service",
              "Cosine similarity search. Body: { embedding, top_k?, threshold?, filter? }",
            ],
          ]}
        />
        <DocAlert type="info">
          Vector tables require a column of type{" "}
          <code className="font-mono text-xs">vector</code> (pgvector). Create
          them from the SQL Database dashboard and set the column type to{" "}
          <strong>vector</strong>.
        </DocAlert>
      </DocSection>
    </DocPage>
  );
}