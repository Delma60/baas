// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/docs/storage/page.tsx
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

export const metadata: Metadata = { title: "Storage · Docs · YourBaaS" };

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function StorageDocsPage({ params }: Props) {
  const { projectId } = await params;

  return (
    <DocPage
      title="Storage"
      description="Self-hosted object storage. Files are never proxied through the API server — uploads and downloads use presigned URLs that go directly to storage."
      badge="Object Storage"
      badgeColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
      toc={[
        { id: "how-it-works", label: "How it works" },
        { id: "setup", label: "Setup" },
        { id: "upload", label: "Upload a file" },
        { id: "list", label: "List files" },
        { id: "download", label: "Download URL" },
        { id: "delete", label: "Delete a file" },
        { id: "buckets", label: "Manage Buckets" },
        { id: "rest-api", label: "REST API" },
      ]}
    >
      <DocSection id="how-it-works" title="How it works">
        <DocP>
          Storage uses a two-step presigned URL flow. Your app requests a
          short-lived upload URL from the API, then the client sends the file
          directly to storage — no bandwidth passes through the YourBaaS server.
        </DocP>
        <div className="rounded-xl border border-border bg-surface p-4 font-mono text-[12px] text-text-secondary leading-relaxed">
          <p>
            1. Client → API:{" "}
            <span className="text-brand">
              POST /v1/storage/{`{project}`}/{`{bucket}`}/upload
            </span>
          </p>
          <p className="pl-4 text-text-muted">
            ← returns upload_url + file_url
          </p>
          <p className="mt-2">
            2. Client → storage:{" "}
            <span className="text-brand">PUT {`{upload_url}`}</span> (file
            bytes)
          </p>
          <p className="pl-4 text-text-muted">
            ← file stored directly, no proxy
          </p>
          <p className="mt-2">
            3. Client uses <span className="text-brand">file_url</span> to
            display or share the file
          </p>
        </div>
        <DocAlert type="info">
          Files are scoped to your project. Bucket names are prefixed as{" "}
          <code className="font-mono text-xs">{`{projectId}-{bucketName}`}</code>
          .
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

      <DocSection id="upload" title="Upload a file">
        <DocP>
          Request a presigned PUT URL, then upload the file directly from the
          browser or server.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript (Browser)",
              lang: "typescript",
              code: `const file = event.target.files[0]

// Step 1 — get presigned URL
const { uploadUrl, fileUrl } = await baas.storage("avatars").upload({
  filename: file.name,
  contentType: file.type,
  expiresIn: 3600, // default
})

// Step 2 — upload directly to storage
await fetch(uploadUrl, {
  method: "PUT",
  body: file,
  headers: { "Content-Type": file.type },
})

// Step 3 — fileUrl is now permanently accessible
console.log("File available at:", fileUrl)`,
            },
            {
              label: "TypeScript (Node.js)",
              lang: "typescript",
              code: `import fs from "fs"

const { uploadUrl, fileUrl } = await baas.storage("documents").upload({
  filename: "report.pdf",
  contentType: "application/pdf",
})

const buffer = fs.readFileSync("./report.pdf")
await fetch(uploadUrl, {
  method: "PUT",
  body: buffer,
  headers: { "Content-Type": "application/pdf" },
})`,
            },
            {
              label: "Python",
              lang: "python",
              code: `import httpx

result = await baas.storage("avatars").upload(
    filename="profile.jpg",
    content_type="image/jpeg",
    expires_in=3600,
)

# Upload directly to storage
async with httpx.AsyncClient() as client:
    with open("profile.jpg", "rb") as f:
        await client.put(result.upload_url, content=f.read(),
                         headers={"Content-Type": "image/jpeg"})

print("File at:", result.file_url)`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="list" title="List files">
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `// List all files in a bucket
const files = await baas.storage("avatars").listFiles()

// Filter by prefix (like a folder)
const reports = await baas.storage("documents").listFiles({
  prefix: "reports/2024/",
  limit: 50,
})

files.forEach(f => {
  console.log(f.key, f.size, f.lastModified)
})`,
            },
            {
              label: "Python",
              lang: "python",
              code: `files = await baas.storage("avatars").list_files()

# Filter by prefix
reports = await baas.storage("documents").list_files(
    prefix="reports/2024/",
    limit=50,
)

for f in files:
    print(f.key, f.size, f.last_modified)`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="download" title="Get a download URL">
        <DocP>
          Generate a presigned URL for secure, time-limited access to any file.
        </DocP>
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const { url } = await baas.storage("avatars").getDownloadUrl("profile.jpg")
// url is valid for 1 hour by default

// Custom expiry
const { url } = await baas.storage("documents").getDownloadUrl("report.pdf", {
  expiresIn: 300, // 5 minutes
})`,
            },
            {
              label: "Python",
              lang: "python",
              code: `url = await baas.storage("avatars").get_download_url("profile.jpg")

# Custom expiry
url = await baas.storage("documents").get_download_url(
    "report.pdf",
    expires_in=300,
)`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="delete" title="Delete a file">
        <DocTabs
          tabs={[
            {
              label: "TypeScript",
              lang: "typescript",
              code: `const result = await baas.storage("avatars").deleteFile("profile.jpg")
// result.deleted === true`,
            },
            {
              label: "Python",
              lang: "python",
              code: `deleted = await baas.storage("avatars").delete_file("profile.jpg")
# True if file existed`,
            },
          ]}
        />
      </DocSection>

      <DocSection id="buckets" title="Manage Buckets">
        <DocP>
          Create and manage buckets from the{" "}
          <a
            href={`/u/${projectId}/projects/${projectId}/storage`}
            className="text-brand underline"
          >
            Storage dashboard
          </a>
          . Buckets can also be created programmatically via the internal API.
        </DocP>
        <DocAlert type="warning">
          Always validate that a bucket belongs to your project before issuing
          presigned URLs. The SDK handles this automatically.
        </DocAlert>
      </DocSection>

      <DocSection id="rest-api" title="REST API">
        <DocTable
          headers={["Method", "Path", "Description"]}
          rows={[
            [
              "POST",
              `/v1/storage/${projectId}/{bucket}/upload`,
              "Get presigned PUT URL",
            ],
            [
              "GET",
              `/v1/storage/${projectId}/{bucket}/files`,
              "List files (prefix, limit)",
            ],
            [
              "DELETE",
              `/v1/storage/${projectId}/{bucket}/{path}`,
              "Delete a file",
            ],
            [
              "GET",
              `/v1/storage/${projectId}/{bucket}/{path}/url`,
              "Get presigned GET URL",
            ],
          ]}
        />
      </DocSection>
    </DocPage>
  );
}
