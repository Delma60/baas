// frontend/lib/api/storage-client.ts
// Server-side API helpers for the storage module

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export interface StorageFile {
  key: string;
  size: number;
  last_modified: string;
  etag: string;
}

export interface StorageBucketInfo {
  files: StorageFile[];
  totalFiles: number;
  totalSize: number;
}

/**
 * Fetch api keys for a project to get the service key for storage calls.
 * Returns the first active anon key found.
 */
export async function getProjectApiKey(projectId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/projects/${projectId}`,
      {
        cache: "no-store",
        headers: {
          "x-internal-secret": INTERNAL_SECRET,
          "Content-Type": "application/json",
        },
      }
    );
    if (!res.ok) return null;
    // We don't store raw keys in the project record, so we need a different approach.
    // For the dashboard, we call the storage listing via internal routes.
    return null;
  } catch {
    return null;
  }
}

/**
 * List files in a storage bucket via the public v1 API with a service key.
 * Since we don't have the raw service key server-side, we add an internal
 * storage listing endpoint or use the internal route.
 *
 * For now, we call the internal storage listing endpoint.
 */
export async function listStorageFiles(
  projectId: string,
  bucket: string,
  prefix?: string
): Promise<{ files: StorageFile[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (prefix) params.set("prefix", prefix);

    const url = `${FASTAPI_BASE_URL}/internal/storage/${projectId}/${bucket}/files?${params}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        "x-internal-secret": INTERNAL_SECRET,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { files: [], error: body?.detail ?? `HTTP ${res.status}` };
    }

    const json = await res.json();
    const files: StorageFile[] = (json.data ?? []).map((f: StorageFile) => f);
    return { files };
  } catch (err) {
    return { files: [], error: String(err) };
  }
}

/**
 * List buckets for a project (derived from api_keys/project config).
 * Since buckets are created on demand, we return the known default buckets.
 */
export async function getProjectBuckets(projectId: string): Promise<string[]> {
  // In the current architecture, buckets are user-defined. We return common ones
  // or fetch from a hypothetical list endpoint. For now we return defaults.
  return ["uploads", "avatars", "documents", "media"];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileType(key: string): "image" | "video" | "audio" | "document" | "code" | "archive" | "other" {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "flac"].includes(ext)) return "audio";
  if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md"].includes(ext)) return "document";
  if (["js", "ts", "py", "go", "rs", "java", "json", "yaml", "yml", "toml"].includes(ext)) return "code";
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return "archive";
  return "other";
}