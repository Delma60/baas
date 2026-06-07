// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/storage/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  HardDrive,
  Upload,
  Folder,
  FolderOpen,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileCode,
  Archive,
  MoreVertical,
  Search,
  Plus,
  RefreshCw,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  AlertTriangle,
  Info,
  Database,
  Globe,
  Lock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StorageBrowser } from "@/components/storage/StorageBrowser";
import { getProjectById } from "@/lib/api/client";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
  searchParams: Promise<{ bucket?: string; prefix?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Storage · ${projectId}` };
}

// ─── Stats card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--background] p-4 hover:border-[--border2] transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-[8px] ${iconBg}`}
        >
          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        </div>
        <span className="text-xs text-[--text-secondary]">{label}</span>
      </div>
      <p className="text-2xl font-medium text-[--text-primary] leading-none">
        {value}
      </p>
      {sub && <p className="text-xs text-[--text-muted] mt-1">{sub}</p>}
    </div>
  );
}

// ─── Page (server component) ──────────────────────────────────────────────────

export default async function StoragePage({ params, searchParams }: Props) {
  const { userId, projectId } = await params;
  const { bucket: activeBucket = "uploads", prefix = "" } = await searchParams;

  // Fetch project info
  let project = null;
  try {
    project = await getProjectById(projectId);
  } catch {
    // project not found handled downstream
  }

  // Known/default buckets — in production these come from the DB
  const buckets = [
    {
      name: "uploads",
      label: "Uploads",
      icon: Upload,
      description: "General file uploads",
    },
    {
      name: "avatars",
      label: "Avatars",
      icon: FileImage,
      description: "User profile images",
    },
    {
      name: "documents",
      label: "Documents",
      icon: FileText,
      description: "PDFs and docs",
    },
    {
      name: "media",
      label: "Media",
      icon: FileVideo,
      description: "Videos and audio",
    },
  ];

  const FASTAPI_BASE_URL =
    process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
  const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

  // Fetch files for the active bucket from the backend
  let files: Array<{
    key: string;
    size: number;
    last_modified: string;
    etag: string;
  }> = [];
  let fetchError: string | null = null;

  try {
    const params_url = new URLSearchParams();
    if (prefix) params_url.set("prefix", prefix);
    params_url.set("limit", "200");

    // Try v1 API via an internal proxy approach — we call the internal listing endpoint
    // The backend stores files in MinIO; we need a service key to call /v1/storage/...
    // For the dashboard, we call an internal endpoint that bypasses key auth
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/storage/${projectId}/${activeBucket}/files?${params_url}`,
      {
        cache: "no-store",
        headers: {
          "x-internal-secret": INTERNAL_SECRET,
          "Content-Type": "application/json",
        },
      },
    );

    if (res.ok) {
      const json = await res.json();
      files = json.data ?? [];
    } else if (res.status === 404) {
      // Bucket doesn't exist yet — that's OK
      files = [];
    } else {
      const body = await res.json().catch(() => ({}));
      fetchError = body?.detail ?? `HTTP ${res.status}`;
    }
  } catch (err) {
    // Backend unreachable — show empty state
    fetchError = "Cannot reach storage backend";
  }

  // Compute stats
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const imageCount = files.filter((f) => {
    const ext = f.key.split(".").pop()?.toLowerCase() ?? "";
    return ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext);
  }).length;

  function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  const baseUrl = `/u/${userId}/projects/${projectId}/storage`;

  return (
    <div className="flex flex-col h-full bg-[--bg3]">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between border-b border-[--border] bg-[--background] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber-500/10">
            <HardDrive className="h-4.5 w-4.5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-base font-medium text-[--text-primary]">
              Cloud Storage
            </h1>
            <p className="text-sm text-[--text-secondary] mt-0.5">
              MinIO-powered object storage with presigned URLs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`${baseUrl}?bucket=${activeBucket}`}>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            New Bucket
          </Button>
          {/* Upload is handled client-side */}
          <StorageUploadButton projectId={projectId} bucket={activeBucket} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar: Buckets ── */}
        <aside className="w-[220px] shrink-0 border-r border-[--border] bg-[--background] flex flex-col">
          <div className="px-3 py-3 border-b border-[--border]">
            <p className="text-[10.5px] font-semibold uppercase tracking-widest text-[--text-muted]">
              Buckets
            </p>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {buckets.map((bucket) => {
              const Icon = bucket.icon;
              const isActive = activeBucket === bucket.name;
              return (
                <Link
                  key={bucket.name}
                  href={`${baseUrl}?bucket=${bucket.name}`}
                  className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                    isActive
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 font-medium"
                      : "text-[--text-secondary] hover:bg-[--surface] hover:text-[--text-primary]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? "text-amber-500"
                        : "text-[--text-muted] group-hover:text-[--text-secondary]"
                    }`}
                  />
                  <span className="truncate">{bucket.label}</span>
                  {isActive && (
                    <span className="ml-auto text-[11px] font-mono text-amber-600 dark:text-amber-400">
                      {files.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Storage info */}
          <div className="border-t border-[--border] p-3">
            <div className="rounded-lg bg-[--surface] border border-[--border] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[--text-muted]">Used</span>
                <span className="font-medium text-[--text-primary]">
                  {formatBytes(totalSize)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[--border] overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{
                    width: `${Math.min((totalSize / (1024 * 1024 * 1024)) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-[--text-muted]">
                of 1 GB (Free plan)
              </p>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-[--border] bg-[--background]">
            <StatCard
              icon={File}
              label="Total files"
              value={files.length.toString()}
              iconBg="bg-[--info-bg]"
              iconColor="text-[--info-text]"
            />
            <StatCard
              icon={HardDrive}
              label="Total size"
              value={formatBytes(totalSize)}
              sub={`in ${activeBucket}`}
              iconBg="bg-amber-500/10"
              iconColor="text-amber-500"
            />
            <StatCard
              icon={FileImage}
              label="Images"
              value={imageCount.toString()}
              iconBg="bg-[--success-bg]"
              iconColor="text-[--success-text]"
            />
            <StatCard
              icon={Globe}
              label="CDN"
              value="MinIO"
              sub="Self-hosted"
              iconBg="bg-[#7F77DD]/10"
              iconColor="text-[#7F77DD]"
            />
          </div>

          {/* Error banner */}
          {fetchError && (
            <div className="mx-6 mt-4">
              <Alert className="border-yellow-200/50 bg-[--warn-bg]">
                <AlertTriangle className="h-4 w-4 text-[--warn-text]" />
                <AlertDescription className="text-[12.5px] text-[--warn-text]">
                  {fetchError === "Cannot reach storage backend"
                    ? "Storage backend is unreachable. Showing empty state."
                    : `Could not load files: ${fetchError}`}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* File browser — client component for interactivity */}
          <StorageBrowser
            projectId={projectId}
            userId={userId}
            bucket={activeBucket}
            prefix={prefix}
            files={files}
            baseUrl={baseUrl}
          />
        </main>
      </div>
    </div>
  );
}

// ─── Upload button (client island) ───────────────────────────────────────────

function StorageUploadButton({
  projectId,
  bucket,
}: {
  projectId: string;
  bucket: string;
}) {
  // This renders a button that triggers the client-side uploader in StorageBrowser
  return (
    <Button
      size="sm"
      className="h-8 gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0"
      id="storage-upload-trigger"
    >
      <Upload className="h-3.5 w-3.5" />
      Upload files
    </Button>
  );
}
