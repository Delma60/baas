// frontend/app/docs/quickstart-python/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getProjectsByUser } from "@/lib/api/client";
import {
  DocPage,
  DocSection,
  DocSubSection,
  DocP,
  DocTabs,
  DocAlert,
  DocTable,
} from "@/components/docs/DocPage";

export const metadata: Metadata = {
  title: "Python Quickstart · Docs · YourBaaS",
};

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function QuickstartPythonPage({ params }: Props) {
  const session = await auth();
  let projectId = "";

  try {
    const { projectId: pid } = await params;
    projectId = pid ?? "";
  } catch {}

  if (!projectId && session?.user?.id) {
    try {
      const projects = await getProjectsByUser(session.user.id);
      if (projects[0]) {
        projectId = projects[0].id;
      }
    } catch {}
  }

  const displayProjectId = projectId || "proj_your_project_id";

  return (
    <DocPage
      title="Python Quickstart"
      description="Get your first YourBaaS query running in Python in under 5 minutes. Works with asyncio, Django, FastAPI, scripts, and Jupyter notebooks."
      badge="Python"
      badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      toc={[
        { id: "install", label: "Install" },
        { id: "init", label: "Initialize client" },
        { id: "first-query", label: "First query" },
        { id: "insert", label: "Insert data" },
        { id: "auth", label: "Add authentication" },
        { id: "sync", label: "Sync usage (scripts)" },
        { id: "realtime", label: "Real-time updates" },
        { id: "next-steps", label: "Next steps" },
      ]}
    >
      <DocSection id="install" title="Install the SDK">
        <DocTabs
          tabs={[
            {
              label: "pip",
              lang: "bash",
              code: `pip install baas`,
            },
            {
              label: "uv",
              lang: "bash",
              code: `uv add baas`,
            },
            {
              label: "poetry",
              lang: "bash",
              code: `poetry add baas`,
            },
          ]}
        />
        <DocAlert type="info">
          The SDK requires Python 3.9+. For realtime subscriptions install the
          optional extra:{" "}
          <code className="font-mono text-xs">
            pip install &apos;baas[realtime]&apos;
          </code>
        </DocAlert>
      </DocSection>

      <DocSection id="init" title="Initialize the client">
        <DocP>
          Get your project ID and API keys from{" "}
          <strong>Settings → API Keys</strong>. Use the anon key for
          client-facing code — it&apos;s safe to commit to a frontend repo but
          never to a server that handles privileged operations.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "Async (recommended)",
              lang: "python",
              code: `from baas import BaasClient

baas = BaasClient(
    project_id="${displayProjectId}",
    api_key="sk_anon_...",       # from Settings → API Keys
    # base_url="https://api.yourbaas.com"  # default
)`,
            },
            {
              label: "Context manager",
              lang: "python",
              code: `from baas import BaasClient

async def main():
    async with BaasClient(
        project_id="${displayProjectId}",
        api_key="sk_anon_...",
    ) as baas:
        result = await baas.db("posts").select("*").limit(5).execute()
        print(result.data)
    # connection automatically closed`,
            },
            {
              label: "Environment variable",
              lang: "python",
              code: `import os
from baas import BaasClient

# Set BAAS_BASE_URL in your .env to override the default
baas = BaasClient(
    project_id=os.environ["BAAS_PROJECT_ID"],
    api_key=os.environ["BAAS_ANON_KEY"],
)`,
            },
          ]}
        />
        <DocAlert type="info">
          You can also set <code className="font-mono text-xs">BAAS_BASE_URL</code>{" "}
          in a <code className="font-mono text-xs">.env</code> file — the SDK
          loads it automatically via python-dotenv.
        </DocAlert>
      </DocSection>

      <DocSection id="first-query" title="Your first query">
        <DocP>
          Query any table in your SQL database. The SDK is fully typed with
          Python type annotations.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "Python",
              lang: "python",
              code: `import asyncio
from baas import BaasClient

async def main():
    baas = BaasClient(project_id="${displayProjectId}", api_key="sk_anon_...")

    # List rows
    result = await baas.db("posts") \\
        .select("id, title, created_at") \\
        .filter("status", "eq", "published") \\
        .order("created_at", "desc") \\
        .limit(20) \\
        .execute()

    print(result.data)   # list of dicts
    print(result.count)  # total matching rows

    # Get one row
    post = await baas.db("posts").get("row-id-123")

    await baas.destroy()

asyncio.run(main())`,
            },
            {
              label: "FastAPI",
              lang: "python",
              code: `from fastapi import FastAPI
from baas import BaasClient

app = FastAPI()
baas = BaasClient(project_id="${displayProjectId}", api_key="sk_anon_...")

@app.get("/posts")
async def list_posts():
    result = await baas.db("posts") \\
        .filter("status", "eq", "published") \\
        .order("created_at", "desc") \\
        .limit(20) \\
        .execute()
    return result.data`,
            },
            {
              label: "Jupyter",
              lang: "python",
              code: `from baas import BaasClient

baas = BaasClient(project_id="${displayProjectId}", api_key="sk_anon_...")

# In an async Jupyter cell (IPython 7+):
result = await baas.db("posts").select("id, title").limit(10).execute()
result.data`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="insert" title="Insert and update data">
        <DocP>
          All write operations require a service-role key. Use it only in
          server-side code — never expose it to clients.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "Python",
              lang: "python",
              code: `# Insert a row
post = await baas.db("posts").insert({
    "title": "Hello, YourBaaS!",
    "status": "draft",
    "user_id": "user_abc123",
})
print(post["id"])  # auto-generated id

# Insert many
rows = await baas.db("posts").insert([
    {"title": "Part 1"},
    {"title": "Part 2"},
])

# Update a row
updated = await baas.db("posts").update(post["id"], {
    "status": "published",
})

# Delete a row
result = await baas.db("posts").delete(post["id"])
# result["deleted"] == True`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="auth" title="Add authentication">
        <DocP>
          Authenticate users in your project. Sessions are managed automatically
          — subsequent requests carry the user JWT in <code>X-User-Token</code>.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "Python",
              lang: "python",
              code: `# Sign up
session = await baas.auth.sign_up(
    email="user@example.com",
    password="password123",
    name="Alice",
)
print(session.user.id)       # "usr_abc..."
print(session.access_token)  # JWT

# Sign in
session = await baas.auth.sign_in(
    email="user@example.com",
    password="password123",
)

# Get current user (server call)
user = await baas.auth.me()
print(user.email, user.is_email_verified)

# Listen for session changes
def on_change(session):
    if session:
        print("Logged in as", session.user.email)
    else:
        print("Signed out")

unsub = baas.auth.on_session_change(on_change)

# Sign out
await baas.auth.sign_out()

# Remove listener
unsub()`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="sync" title="Sync usage (scripts & notebooks)">
        <DocP>
          For scripts and notebooks where you don&apos;t want to manage an event
          loop, use <code className="font-mono text-xs">BaasClientSync</code>.
          Every async method becomes synchronous.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "Python",
              lang: "python",
              code: `from baas import BaasClientSync

baas = BaasClientSync(
    project_id="${displayProjectId}",
    api_key="sk_anon_...",
)

# All methods are synchronous
result = baas.db("posts").select("id, title").limit(10).execute()
print(result.data)

value = baas.kv.get("my-key")
baas.kv.set("counter", 42)

baas.destroy()  # close connections`,
            },
          ]}
        />
        <DocAlert type="warning">
          <code className="font-mono text-xs">BaasClientSync</code> uses{" "}
          <code className="font-mono text-xs">asyncio.run()</code> internally and
          cannot be used inside an already-running event loop (e.g., inside an
          async FastAPI route). Use <code className="font-mono text-xs">BaasClient</code>{" "}
          there instead.
        </DocAlert>
      </DocSection>

      <DocSection id="realtime" title="Real-time updates">
        <DocP>
          Subscribe to live database changes. Requires the realtime extra:
          {" "}
          <code className="font-mono text-xs">pip install &apos;baas[realtime]&apos;</code>
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "Python",
              lang: "python",
              code: `import asyncio
from baas import BaasClient

async def main():
    baas = BaasClient(project_id="${displayProjectId}", api_key="sk_anon_...")

    # Subscribe to a SQL table
    def on_post_change(event):
        print(f"{event.type}: {event.record}")
        # event.type  → "INSERT" | "UPDATE" | "DELETE"
        # event.record → the new document/row

    unsub = baas.realtime.on("posts", on_post_change)

    # Subscribe to a NoSQL collection
    unsub2 = baas.realtime.on_collection("articles", on_post_change)

    # Connect explicitly (or it connects lazily on first subscription)
    await baas.realtime.connect()

    # Keep alive
    await asyncio.sleep(60)

    # Cleanup
    unsub()
    unsub2()
    await baas.realtime.disconnect()
    await baas.destroy()

asyncio.run(main())`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="next-steps" title="Next steps">
        <DocTable
          headers={["Feature", "Guide"]}
          rows={[
            ["SQL Database", "Full CRUD, filtering, ordering, RPC functions"],
            ["NoSQL / Documents", "MongoDB-style documents and aggregations"],
            ["Key-Value Store", "Fast KV with TTL and batch operations"],
            ["Storage", "Presigned upload/download URLs"],
            ["Authentication", "Sessions, refresh tokens, user management"],
            ["Realtime", "Change streams and subscriptions"],
            ["Edge Functions", "Invoke serverless functions"],
          ]}
        />
        <DocAlert type="success">
          The SDK mirrors the JavaScript API exactly — method names are the
          same (in snake_case), so any JS example in these docs translates
          directly to Python.
        </DocAlert>
      </DocSection>
    </DocPage>
  );
}