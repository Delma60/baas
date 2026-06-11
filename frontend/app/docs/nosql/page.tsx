// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/docs/nosql/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
import { getNoSQLCollections } from "@/lib/api/nosql-client";
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

export const metadata: Metadata = { title: `NoSQL · Docs · ${APP_NAME}` };

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function NoSQLDocsPage({ params }: Props) {
  const { projectId } = await params;

  let mongoDatabase = "";
  let collections: string[] = [];
  try {
    const project = await getProjectById(projectId);
    mongoDatabase = (project as any).mongo_database ?? "";
    if (mongoDatabase) {
      collections = await getNoSQLCollections(projectId, mongoDatabase).catch(
        () => [],
      );
      collections = collections.filter((c) => !c.startsWith("_"));
    }
  } catch {}

  const exampleCollection = collections[0] ?? "articles";

  return (
    <DocPage
      title="NoSQL / Documents"
      description="Flexible document storage. Insert, query with filters, run aggregation pipelines, and subscribe to live changes — all without writing any database query syntax."
      badge="Documents"
      badgeColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      toc={[
        { id: "setup", label: "Setup" },
        { id: "collections", label: "Collections" },
        { id: "find", label: "Find documents", level: 3 },
        { id: "insert", label: "Insert documents", level: 3 },
        { id: "update", label: "Update documents", level: 3 },
        { id: "delete", label: "Delete documents", level: 3 },
        { id: "aggregate", label: "Aggregation Pipeline" },
        { id: "rest-api", label: "REST API" },
        { id: "your-collections", label: "Your Collections" },
      ]}
    >
      <DocSection id="setup" title="Setup">
        <DocP>
          Initialize the client with your project ID and anon API key.
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

baas = BaasClient(project_id="${projectId}", api_key="sk_anon_...")`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="collections" title="Collections">
        <DocSubSection id="find" title="Find documents">
          <DocP>
            Use{" "}
            <code className="text-brand bg-brand/10 px-1 rounded text-xs">
              .find(filter)
            </code>{" "}
            with a JSON-style filter to query documents.
          </DocP>
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `// Find all published articles
const { data } = await baas.nosql("${exampleCollection}")
  .find({ status: "published" })
  .sort({ createdAt: -1 })
  .limit(10)
  .execute()

// Find by ID
const doc = await baas.nosql("${exampleCollection}").findById("doc-id-123")`,
              },
              {
                label: "Python",
                lang: "python",
                code: `# Find all published articles
result = await baas.nosql("${exampleCollection}") \\
    .find({"status": "published"}) \\
    .sort("created_at", -1) \\
    .limit(10) \\
    .execute()

# Find by ID
doc = await baas.nosql("${exampleCollection}").get("doc-id-123")`,
              },
              {
                label: "curl",
                lang: "bash",
                code: `curl "${process.env.NEXT_PUBLIC_APP_URL ?? "https://api.yourbaas.com"}/v1/nosql/${projectId}/collections/${exampleCollection}?limit=10&sort_field=createdAt&sort_dir=-1" \\
  -H "Authorization: Bearer sk_anon_..."`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="insert" title="Insert documents">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `// Insert one
const doc = await baas.nosql("${exampleCollection}").insertOne({
  title: "Hello world",
  status: "draft",
  tags: ["intro", "tutorial"],
})

// Insert many
const result = await baas.nosql("${exampleCollection}").insertMany([
  { title: "Article A" },
  { title: "Article B" },
])
console.log(result.insertedIds) // ["id1", "id2"]`,
              },
              {
                label: "Python",
                lang: "python",
                code: `# Insert one
doc = await baas.nosql("${exampleCollection}").insert_one({
    "title": "Hello world",
    "status": "draft",
    "tags": ["intro", "tutorial"],
})

# Insert many
ids = await baas.nosql("${exampleCollection}").insert_many([
    {"title": "Article A"},
    {"title": "Article B"},
])`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="update" title="Update documents">
          <DocP>
            Use update operators like{" "}
            <code className="text-brand bg-brand/10 px-1 rounded text-xs">
              $set
            </code>
            ,{" "}
            <code className="text-brand bg-brand/10 px-1 rounded text-xs">
              $push
            </code>
            ,{" "}
            <code className="text-brand bg-brand/10 px-1 rounded text-xs">
              $inc
            </code>
            . Plain objects are automatically wrapped in{" "}
            <code className="text-brand bg-brand/10 px-1 rounded text-xs">
              $set
            </code>
            .
          </DocP>
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `// With $set operator
await baas.nosql("${exampleCollection}").updateOne("doc-id-123", {
  $set: { title: "Updated title", status: "published" },
})

// Shorthand (auto-wraps in $set)
await baas.nosql("${exampleCollection}").updateOne("doc-id-123", {
  title: "Updated title",
})`,
              },
              {
                label: "Python",
                lang: "python",
                code: `await baas.nosql("${exampleCollection}").update_one("doc-id-123", {
    "$set": {"title": "Updated title", "status": "published"}
})`,
              },
            ]}
          />
        </DocSubSection>

        <DocSubSection id="delete" title="Delete documents">
          <DocTabs
            tabs={[
              {
                label: "TypeScript",
                lang: "typescript",
                code: `await baas.nosql("${exampleCollection}").deleteOne("doc-id-123")`,
              },
              {
                label: "Python",
                lang: "python",
                code: `await baas.nosql("${exampleCollection}").delete_one("doc-id-123")`,
              },
            ]}
          />
        </DocSubSection>
      </DocSection>

      <DocSection id="aggregate" title="Aggregation Pipeline">
        <DocP>
          Run aggregation pipelines for complex analytics, grouping, and
          transformations.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const results = await baas.nosql("${exampleCollection}").aggregate([
  { $match: { status: "published" } },
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 5 },
])`,
            },
            {
              label: "Python",
              lang: "python",
              code: `results = await baas.nosql("${exampleCollection}").aggregate([
    {"$match": {"status": "published"}},
    {"$group": {"_id": "$category", "count": {"$sum": 1}}},
    {"$sort": {"count": -1}},
    {"$limit": 5},
])`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="rest-api" title="REST API">
        <DocTable
          headers={["Method", "Path", "Description"]}
          rows={[
            [
              "GET",
              `/v1/nosql/${projectId}/collections/{name}`,
              "Find documents",
            ],
            [
              "GET",
              `/v1/nosql/${projectId}/collections/{name}/{id}`,
              "Get document by ID",
            ],
            [
              "POST",
              `/v1/nosql/${projectId}/collections/{name}`,
              "Insert one or many",
            ],
            [
              "PATCH",
              `/v1/nosql/${projectId}/collections/{name}/{id}`,
              "Update document",
            ],
            [
              "DELETE",
              `/v1/nosql/${projectId}/collections/{name}/{id}`,
              "Delete document",
            ],
            [
              "POST",
              `/v1/nosql/${projectId}/collections/{name}/aggregate`,
              "Run pipeline",
            ],
          ]}
        />
      </DocSection>

      {collections.length > 0 && (
        <DocSection id="your-collections" title="Your Collections">
          <DocP>
            Collections in your project{" "}
            <code className="text-brand bg-brand/10 px-1 rounded text-xs">
              {mongoDatabase}
            </code>
            :
          </DocP>
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <span
                key={c}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-[12px] text-text-secondary"
              >
                {c}
              </span>
            ))}
          </div>
        </DocSection>
      )}
    </DocPage>
  );
}
