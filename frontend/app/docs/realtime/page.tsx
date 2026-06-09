// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/docs/realtime/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
import { getRealtimeStats } from "@/lib/api/realtime-client";
import {
  DocPage,
  DocSection,
  DocSubSection,
  DocP,
  DocTabs,
  DocAlert,
  DocTable,
} from "@/components/docs/DocPage";

export const metadata: Metadata = { title: "Realtime · Docs · YourBaaS" };

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function RealtimeDocsPage({ params }: Props) {
  const { projectId } = await params;

  let stats = { total_channels: 0, active_channels: 0, connected_clients: 0 };
  try {
    stats = await getRealtimeStats(projectId).catch(() => stats);
  } catch {}

  return (
    <DocPage
      title="Realtime"
      description="Subscribe to live database changes in real time. SQL and NoSQL change streams power instant updates."
      badge="Realtime"
      badgeColor="bg-pink-500/10 text-pink-600 dark:text-pink-400"
      toc={[
        { id: "how-it-works", label: "How it works" },
        { id: "setup", label: "Setup" },
        { id: "subscribe-sql", label: "Subscribe to SQL table" },
        { id: "subscribe-nosql", label: "Subscribe to NoSQL collection" },
        { id: "event-types", label: "Event types" },
        { id: "unsubscribe", label: "Unsubscribe" },
        { id: "connection", label: "Connection management" },
        { id: "rest-api", label: "Subscribe endpoint" },
      ]}
    >
      {stats.total_channels > 0 && (
        <DocAlert type="info">
          Your project has <strong>{stats.total_channels}</strong> channel
          {stats.total_channels !== 1 ? "s" : ""} configured with{" "}
          <strong>{stats.connected_clients}</strong> connected client
          {stats.connected_clients !== 1 ? "s" : ""}. Manage channels in the{" "}
          <a
            href={`/u/${projectId}/projects/${projectId}/realtime`}
            className="underline font-medium"
          >
            Realtime dashboard
          </a>
          .
        </DocAlert>
      )}

      <DocSection id="how-it-works" title="How it works">
        <DocP>
          When you subscribe to a table or collection, the SDK opens a realtime
          connection. The server sends events whenever a row is inserted,
          updated, or deleted.
        </DocP>
        <div className="rounded-xl border border-border bg-surface p-4 font-mono text-[12px] text-text-secondary leading-relaxed">
          <p>
            SQL: <span className="text-brand">SQL change feed</span> → realtime
            stream → your callback
          </p>
          <p>
            NoSQL: <span className="text-brand">NoSQL change feed</span> →
            realtime stream → your callback
          </p>
        </div>
        <DocAlert type="info">
          The realtime connection is <strong>lazy</strong> — it only opens when
          you call your first <code className="font-mono text-xs">.on()</code>{" "}
          subscription.
        </DocAlert>
      </DocSection>

      <DocSection id="setup" title="Setup">
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

baas = BaasClient(project_id="${projectId}", api_key="sk_anon_...")`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="subscribe-sql" title="Subscribe to SQL table changes">
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const unsub = baas.realtime.on("posts", (event) => {
  switch (event.type) {
    case "INSERT":
      console.log("New post:", event.record)
      break
    case "UPDATE":
      console.log("Updated:", event.record, "was:", event.old)
      break
    case "DELETE":
      console.log("Deleted:", event.old)
      break
  }
})

// Filter to specific event types
const unsub2 = baas.realtime.on("posts", handler, {
  eventTypes: ["INSERT", "UPDATE"],
})`,
            },
            {
              label: "Python",
              lang: "python",
              code: `def on_post_change(event):
    if event.type == "INSERT":
        print("New post:", event.record)
    elif event.type == "UPDATE":
        print("Updated:", event.record)

unsub = baas.realtime.on("posts", on_post_change)`,
            },
          ]}
        />
      </DocSection>

      <DocSection
        id="subscribe-nosql"
        title="Subscribe to NoSQL collection changes"
      >
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const unsub = baas.realtime.onCollection("articles", (event) => {
  console.log(event.type, event.record)
})`,
            },
            {
              label: "Python",
              lang: "python",
              code: `unsub = baas.realtime.on_collection("articles", lambda event: print(event))`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="event-types" title="Event types">
        <DocTable
          headers={["Event", "Payload", "Description"]}
          rows={[
            ["INSERT", "event.record", "A new row or document was created"],
            [
              "UPDATE",
              "event.record, event.old",
              "An existing row or document was modified",
            ],
            ["DELETE", "event.old", "A row or document was deleted"],
          ]}
        />
      </DocSection>

      <DocSection id="unsubscribe" title="Unsubscribe & cleanup">
        <DocP>
          Always unsubscribe when your component unmounts or you no longer need
          updates. Call{" "}
          <code className="text-brand bg-brand/10 px-1 rounded text-xs">
            disconnect()
          </code>{" "}
          to close the realtime connection entirely.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `// Remove a single subscription
const unsub = baas.realtime.on("posts", handler)
unsub() // removes this listener, keeps socket open if others exist

// Disconnect entirely (close socket, remove all listeners)
baas.realtime.disconnect()

// React example
useEffect(() => {
  const unsub = baas.realtime.on("posts", setLatestPost)
  return () => unsub()
}, [])`,
            },
            {
              label: "Python",
              lang: "python",
              code: `# Remove a single subscription
unsub()

# Disconnect entirely
await baas.realtime.disconnect()`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="connection" title="Connection management">
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `// Check connection status
const isConnected = baas.realtime.isConnected()

// The socket reconnects automatically on drop (up to 5 attempts)`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="rest-api" title="Subscribe endpoint">
        <DocTable
          headers={["Method", "Path", "Description"]}
          rows={[
            [
              "POST",
              `/v1/realtime/${projectId}/subscribe`,
              "Register a channel and get a subscription name",
            ],
          ]}
        />
        <DocAlert type="info">
          The SDK handles channel registration automatically. You only need to
          call the endpoint directly if you&apos;re building a custom realtime
          client.
        </DocAlert>
      </DocSection>
    </DocPage>
  );
}
