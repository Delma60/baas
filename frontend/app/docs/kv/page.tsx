// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/docs/kv/page.tsx
import type { Metadata } from "next";
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
  title: `Key-Value Store · Docs · ${APP_NAME}`,
};

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function KVDocsPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <DocPage
      title="Key-Value Store"
      description="Fast, flexible key-value storage. Set, get, delete, list with prefix filters, and run batch operations — with optional TTL expiry."
      badge="Key-Value"
      badgeColor="bg-violet-500/10 text-violet-600 dark:text-violet-400"
      toc={[
        { id: "setup", label: "Setup" },
        { id: "basic", label: "Basic Operations" },
        { id: "get", label: "Get a value", level: 3 },
        { id: "set", label: "Set a value", level: 3 },
        { id: "delete", label: "Delete a key", level: 3 },
        { id: "list", label: "List keys" },
        { id: "ttl", label: "TTL / Expiry" },
        { id: "batch", label: "Batch Operations" },
        { id: "rest-api", label: "REST API" },
        { id: "patterns", label: "Common Patterns" },
      ]}
    >
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

      <DocSection id="basic" title="Basic Operations">
        <DocSubSection id="get" title="Get a value">
          <DocP>
            Returns the stored value, or{" "}
            <code className="text-brand bg-brand/10 px-1 rounded text-xs">
              null
            </code>{" "}
            if the key doesn&apos;t exist or has expired.
          </DocP>
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `const theme = await baas.kv.get("user:prefs:theme")
// "dark" | null`,
              },
              {
                label: "Python",
                lang: "python",
                code: `theme = await baas.kv.get("user:prefs:theme")
# "dark" | None`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="set" title="Set a value">
          <DocP>
            Values can be any JSON-serializable type: strings, numbers,
            booleans, objects, or arrays.
          </DocP>
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `await baas.kv.set("user:prefs:theme", "dark")
await baas.kv.set("user:profile", { name: "Alice", plan: "pro" })
await baas.kv.set("counters:views", 42)`,
              },
              {
                label: "Python",
                lang: "python",
                code: `await baas.kv.set("user:prefs:theme", "dark")
await baas.kv.set("user:profile", {"name": "Alice", "plan": "pro"})
await baas.kv.set("counters:views", 42)`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="delete" title="Delete a key">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `const result = await baas.kv.delete("user:prefs:theme")
// result.deleted === true`,
              },
              {
                label: "Python",
                lang: "python",
                code: `deleted = await baas.kv.delete("user:prefs:theme")
# True if key existed, False if not found`,
              },
            ]}
          />
        </DocSubSection>
      </DocSection>

      <DocSection id="list" title="List Keys">
        <DocP>
          Use prefix filtering to list all keys under a namespace. Useful for
          user sessions, per-user settings, or any grouped data.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `// List all keys
const all = await baas.kv.list()

// List by prefix
const userPrefs = await baas.kv.list({ prefix: "user:prefs:", limit: 100 })
// [{ key: "user:prefs:theme", value: "dark" }, ...]`,
            },
            {
              label: "Python",
              lang: "python",
              code: `# List all keys
all_keys = await baas.kv.list()

# List by prefix
user_prefs = await baas.kv.list(prefix="user:prefs:", limit=100)`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="ttl" title="TTL / Expiry">
        <DocP>
          Set a TTL (time-to-live) in seconds to automatically expire keys.
          Ideal for sessions, rate-limit counters, and temporary flags.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `// Expire in 1 hour
await baas.kv.set("session:abc123", { userId: "user_123" }, { ttl: 3600 })

// Expire in 24 hours
await baas.kv.set("rate_limit:user_123", 0, { ttl: 86400 })`,
            },
            {
              label: "Python",
              lang: "python",
              code: `# Expire in 1 hour
await baas.kv.set("session:abc123", {"userId": "user_123"}, ttl=3600)

# Expire in 24 hours
await baas.kv.set("rate_limit:user_123", 0, ttl=86400)`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="batch" title="Batch Operations">
        <DocP>
          Execute multiple get/set/delete operations in a single network
          round-trip.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const results = await baas.kv.batch([
  { op: "set",    key: "a", value: 1 },
  { op: "get",    key: "b" },
  { op: "delete", key: "c" },
])`,
            },
            {
              label: "Python",
              lang: "python",
              code: `from baas.types.filters import KVBatchOperation

results = await baas.kv.batch([
    KVBatchOperation(op="set",    key="a", value=1),
    KVBatchOperation(op="get",    key="b"),
    KVBatchOperation(op="delete", key="c"),
])`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="rest-api" title="REST API">
        <DocTable
          headers={["Method", "Path", "Description"]}
          rows={[
            ["GET", `/v1/nosql/${projectId}/kv/{key}`, "Get value by key"],
            ["PUT", `/v1/nosql/${projectId}/kv/{key}`, "Set value (upsert)"],
            ["DELETE", `/v1/nosql/${projectId}/kv/{key}`, "Delete key"],
            [
              "GET",
              `/v1/nosql/${projectId}/kv?prefix=`,
              "List keys with optional prefix",
            ],
            ["POST", `/v1/nosql/${projectId}/kv/batch`, "Batch get/set/delete"],
          ]}
        />
      </DocSection>

      <DocSection id="patterns" title="Common Patterns">
        <DocSubSection id="pattern-session" title="User sessions">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `// Store session on login
await baas.kv.set(\`session:\${token}\`, {
  userId,
  email,
  loginAt: Date.now(),
}, { ttl: 60 * 60 * 24 * 7 }) // 7 days

// Retrieve on each request
const session = await baas.kv.get(\`session:\${token}\`)`,
              },
            ]}
          />
        </DocSubSection>
        <DocSubSection id="pattern-ratelimit" title="Rate limiting">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `const key = \`ratelimit:\${userId}:minute\`
const current = (await baas.kv.get(key) as number) ?? 0
if (current >= 60) throw new Error("Rate limited")
await baas.kv.set(key, current + 1, { ttl: 60 })`,
              },
            ]}
          />
        </DocSubSection>
      </DocSection>
    </DocPage>
  );
}
