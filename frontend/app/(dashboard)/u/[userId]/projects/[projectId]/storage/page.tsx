// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/storage/page.tsx
import type { Metadata } from "next";
import { HardDrive, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StorageDashboard } from "@/components/storage/StorageDashboard";
// import { StorageDashboard } from "@/components/storage/StorageDashboard";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
  searchParams: Promise<{ bucket?: string; prefix?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Storage · ${projectId}` };
}

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function fetchBuckets(projectId: string): Promise<Array<{ name: string; file_count: number; total_size: number }>> {
  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/storage/${projectId}/buckets?include_stats=true`,
      { cache: "no-store", headers: { "x-internal-secret": INTERNAL_SECRET } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.buckets ?? [];
  } catch {
    return [];
  }
}

async function fetchFiles(
  projectId: string,
  bucket: string,
  prefix?: string
): Promise<{ files: Array<{ key: string; size: number; last_modified: string; etag: string }>; error?: string }> {
  try {
    const params = new URLSearchParams({ limit: "200" });
    if (prefix) params.set("prefix", prefix);

    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/storage/${projectId}/${bucket}/files?${params}`,
      { cache: "no-store", headers: { "x-internal-secret": INTERNAL_SECRET } }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { files: [], error: body?.detail ?? `HTTP ${res.status}` };
    }

    const json = await res.json();
    return { files: json.data ?? [] };
  } catch (err) {
    return { files: [], error: "Cannot reach storage backend" };
  }
}

export default async function StoragePage({ params, searchParams }: Props) {
  const { userId, projectId } = await params;
  const { bucket: activeBucket, prefix = "" } = await searchParams;

  const [buckets, filesResult] = await Promise.all([
    fetchBuckets(projectId),
    activeBucket ? fetchFiles(projectId, activeBucket, prefix) : Promise.resolve({ files: [] }),
  ]);

  const currentBucket = activeBucket ?? (buckets[0]?.name ?? "uploads");
  const currentFiles = activeBucket ? filesResult.files : [];
  const fetchError = activeBucket ? filesResult.error : undefined;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-3 border-b border-[--border] bg-[--background] px-6 py-5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber-500/10">
          <HardDrive className="h-4.5 w-4.5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-base font-medium text-[--text-primary]">Cloud Storage</h1>
          <p className="text-sm text-[--text-secondary] mt-0.5">
            MinIO-powered object storage with presigned URLs
          </p>
        </div>
      </div>

      {fetchError && (
        <div className="mx-6 mt-4 shrink-0">
          <Alert className="border-yellow-200/50 bg-[--warn-bg]">
            <AlertTriangle className="h-4 w-4 text-[--warn-text]" />
            <AlertDescription className="text-[12.5px] text-[--warn-text]">
              {fetchError === "Cannot reach storage backend"
                ? "Storage backend is unreachable — showing empty state."
                : `Could not load files: ${fetchError}`}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <StorageDashboard
        projectId={projectId}
        userId={userId}
        buckets={buckets}
        activeBucket={currentBucket}
        prefix={prefix}
        initialFiles={currentFiles}
        baseUrl={`/u/${userId}/projects/${projectId}/storage`}
      />
    </div>
  );
}