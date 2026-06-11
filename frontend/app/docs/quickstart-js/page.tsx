// frontend/app/docs/quickstart-js/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
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
import { APP_NAME } from "@/lib/utils/constants";

export const metadata: Metadata = {
  title: `JavaScript / TypeScript Quickstart · Docs · ${APP_NAME}`,
};

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function QuickstartJsPage({ params }: Props) {
  const session = await auth();
  let projectId = "";
  let anonKey = "";

  try {
    const { projectId: pid } = await params;
    projectId = pid ?? "";
  } catch {}

  // Try to get a real project for the examples
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
      title="JavaScript / TypeScript Quickstart"
      description={`Get your first ${APP_NAME} query running in under 5 minutes. Works in Node.js, browser, React, Next.js, and any JS runtime.`}
      badge="TypeScript"
      badgeColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      toc={[
        { id: "install", label: "Install" },
        { id: "init", label: "Initialize client" },
        { id: "first-query", label: "First query" },
        { id: "insert", label: "Insert data" },
        { id: "auth", label: "Add authentication" },
        { id: "realtime", label: "Real-time updates" },
        { id: "next-steps", label: "Next steps" },
      ]}
    >
      <DocSection id="install" title="Install the SDK">
        <DocTabs
          tabs={[
            { label: "npm", lang: "bash", code: `npm install @yourbaas/sdk` },
            { label: "yarn", lang: "bash", code: `yarn add @yourbaas/sdk` },
            { label: "pnpm", lang: "bash", code: `pnpm add @yourbaas/sdk` },
          ]}
        />
      </DocSection>

      <DocSection id="init" title="Initialize the client">
        <DocP>
          Find your project ID and API keys in{" "}
          <strong>Settings → API Keys</strong>. Use the anon key for client-side
          code — it&apos;s safe to expose.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `import { BaasClient } from "@yourbaas/sdk"

const baas = new BaasClient({
  projectId: "${displayProjectId}",
  apiKey: "sk_anon_...",         // from Settings → API Keys
  // baseUrl: "https://api.yourbaas.com"  // default
})

export default baas`,
            },
            {
              label: "Next.js (singleton)",
              lang: "typescript",
              code: `// lib/baas.ts
import { BaasClient } from "@yourbaas/sdk"

const baas = new BaasClient({
  projectId: process.env.NEXT_PUBLIC_BAAS_PROJECT_ID!,
  apiKey: process.env.NEXT_PUBLIC_BAAS_ANON_KEY!,
})

export default baas`,
            },
          ]}
        />
        <DocAlert type="info">
          Never use the service role key client-side. Keep it in server-only
          code or environment variables prefixed without{" "}
          <code>NEXT_PUBLIC_</code>.
        </DocAlert>
      </DocSection>

      <DocSection id="first-query" title="Your first query">
        <DocP>
          Query any table in your SQL database. The SDK returns typed rows with
          full IntelliSense support.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `import baas from "@/lib/baas"

// List rows
const { data, meta } = await baas.db("posts")
  .select("id, title, created_at")
  .filter("status", "eq", "published")
  .order("created_at", "desc")
  .limit(20)
  .execute()

console.log(data)        // { id, title, created_at }[]
console.log(meta.count)  // total matching rows

// Get one row
const post = await baas.db("posts").getById("row-id-123")`,
            },
            {
              label: "React hook",
              lang: "typescript",
              code: `import { useEffect, useState } from "react"
import baas from "@/lib/baas"

export function usePosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    baas.db("posts")
      .filter("status", "eq", "published")
      .order("created_at", "desc")
      .limit(20)
      .execute()
      .then(({ data }) => setPosts(data))
      .finally(() => setLoading(false))
  }, [])

  return { posts, loading }
}`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="insert" title="Insert and update data">
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `// Insert a row
const post = await baas.db("posts").insert({
  title: "Hello, YourBaaS!",
  status: "draft",
  user_id: "user_abc123",
})
console.log(post.id) // auto-generated id

// Update a row
const updated = await baas.db("posts").update(post.id, {
  status: "published",
})

// Delete a row
const result = await baas.db("posts").delete(post.id)
// result.deleted === true`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="auth" title="Add authentication">
        <DocP>
          Sign users up and in to your project. The SDK handles JWT tokens and
          session state automatically.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `// Sign up
const session = await baas.auth.signUp({
  email: "user@example.com",
  password: "password123",
  name: "Alice",
})

// Sign in
const session = await baas.auth.signIn({
  email: "user@example.com",
  password: "password123",
})

console.log(session.user.id)     // "usr_abc..."
console.log(session.accessToken) // JWT for subsequent requests

// Listen for auth changes
const unsub = baas.auth.onSessionChange((session) => {
  if (session) {
    console.log("Logged in:", session.user.email)
  } else {
    console.log("Signed out")
  }
})

// Sign out
await baas.auth.signOut()`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="realtime" title="Real-time updates">
        <DocP>
          Subscribe to live database changes with a single line. The connection
          opens lazily on the first subscription.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `// Subscribe to a SQL table
const unsub = baas.realtime.on("posts", (event) => {
  console.log(event.type)   // "INSERT" | "UPDATE" | "DELETE"
  console.log(event.record) // the new row
})

// React example
useEffect(() => {
  const unsub = baas.realtime.on("posts", (event) => {
    if (event.type === "INSERT") {
      setPosts(prev => [event.record, ...prev])
    }
  })
  return () => unsub() // cleanup on unmount
}, [])`,
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
            ["Authentication", "Sessions, refresh tokens, OAuth"],
            ["Realtime", "Change streams, Socket.io subscriptions"],
            ["Edge Functions", "Invoke serverless functions"],
          ]}
        />
        <DocAlert type="success">
          The SDK is fully typed. Use your editor&apos;s IntelliSense to explore
          every method — all options and return types are documented inline.
        </DocAlert>
      </DocSection>
    </DocPage>
  );
}
