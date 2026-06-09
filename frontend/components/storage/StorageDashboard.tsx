// frontend/components/storage/StorageDashboard.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileCode,
  Archive,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  Download,
  Trash2,
  Copy,
  X,
  Check,
  Loader2,
  FolderOpen,
  ChevronRight,
  CloudUpload,
  AlertCircle,
  Plus,
  RefreshCw,
  HardDrive,
  LayoutGrid,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StorageFile {
  key: string;
  size: number;
  last_modified: string;
  etag: string;
}

interface BucketInfo {
  name: string;
  file_count: number;
  total_size: number;
}

interface StorageDashboardProps {
  projectId: string;
  userId: string;
  buckets: BucketInfo[];
  activeBucket: string;
  prefix: string;
  initialFiles: StorageFile[];
  baseUrl: string;
}

type ViewMode = "list" | "grid";
type UploadStatus = "idle" | "uploading" | "done" | "error";

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  uploadedKey?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

type FileType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "code"
  | "archive"
  | "other";

function getFileType(key: string): FileType {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "ico"].includes(ext))
    return "image";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext)) return "audio";
  if (
    [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "md",
      "csv",
    ].includes(ext)
  )
    return "document";
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "go",
      "rs",
      "java",
      "json",
      "yaml",
      "yml",
      "toml",
      "sh",
      "html",
      "css",
    ].includes(ext)
  )
    return "code";
  if (["zip", "tar", "gz", "rar", "7z", "bz2"].includes(ext)) return "archive";
  return "other";
}

function getFileName(key: string): string {
  return key.split("/").pop() ?? key;
}

const FILE_ICONS: Record<FileType, React.ElementType> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  code: FileCode,
  archive: Archive,
  other: File,
};

const FILE_COLORS: Record<FileType, string> = {
  image: "text-emerald-500",
  video: "text-violet-500",
  audio: "text-pink-500",
  document: "text-blue-500",
  code: "text-amber-500",
  archive: "text-orange-500",
  other: "text-text-muted",
};

const FILE_BG: Record<FileType, string> = {
  image: "bg-emerald-500/10",
  video: "bg-violet-500/10",
  audio: "bg-pink-500/10",
  document: "bg-blue-500/10",
  code: "bg-amber-500/10",
  archive: "bg-orange-500/10",
  other: "bg-surface",
};

// ─── File Icon Component ──────────────────────────────────────────────────────

function FileTypeIcon({
  fileKey,
  size = "md",
}: {
  fileKey: string;
  size?: "sm" | "md" | "lg";
}) {
  const type = getFileType(fileKey);
  const Icon = FILE_ICONS[type];
  const sizeMap = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  const iconMap = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        sizeMap[size],
        FILE_BG[type],
      )}
    >
      <Icon className={cn(iconMap[size], FILE_COLORS[type])} />
    </div>
  );
}

// ─── Bucket Nav (shared between sidebar and sheet) ───────────────────────────

function BucketNav({
  buckets,
  activeBucket,
  baseUrl,
  projectId,
  onCreated,
  onClose,
}: {
  buckets: BucketInfo[];
  activeBucket: string;
  baseUrl: string;
  projectId: string;
  onCreated: (name: string) => void;
  onClose?: () => void;
}) {
  const BUCKET_ICONS: Record<string, React.ElementType> = {
    uploads: Upload,
    avatars: FileImage,
    documents: FileText,
    media: FileVideo,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <p className="text-[10.5px] font-semibold uppercase tracking-widest text-text-muted">
          Buckets
        </p>
        <CreateBucketDialog
          projectId={projectId}
          onCreated={(name) => {
            onCreated(name);
            onClose?.();
          }}
        />
      </div>

      {buckets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center gap-3">
          <HardDrive className="h-8 w-8 text-text-muted opacity-30" />
          <p className="text-xs text-text-muted">No buckets yet</p>
          <CreateBucketDialog projectId={projectId} onCreated={onCreated} />
        </div>
      ) : (
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {buckets.map((bucket) => {
            const Icon = BUCKET_ICONS[bucket.name] ?? HardDrive;
            const isActive = activeBucket === bucket.name;
            return (
              <Link
                key={bucket.name}
                href={`${baseUrl}?bucket=${bucket.name}`}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                  isActive
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 font-medium"
                    : "text-text-secondary hover:bg-surface hover:text-text-primary",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-amber-500" : "text-text-muted",
                  )}
                />
                <span className="truncate">{bucket.name}</span>
                <span
                  className={cn(
                    "ml-auto text-[11px] font-mono",
                    isActive
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-text-muted",
                  )}
                >
                  {bucket.file_count}
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

// ─── Create Bucket Dialog ─────────────────────────────────────────────────────

function CreateBucketDialog({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated: (name: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = async () => {
    const cleanName = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    if (!cleanName) {
      setError("Bucket name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/internal/storage/buckets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, bucket: cleanName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Failed to create bucket");
        return;
      }
      onCreated(cleanName);
      setOpen(false);
      setName("");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" />
        <span className="hidden sm:inline">New</span>
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) {
            setOpen(false);
            setError(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create bucket</DialogTitle>
            <DialogDescription className="text-xs">
              Buckets are containers for your files. Use lowercase letters,
              numbers, and hyphens.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-danger-bg bg-danger-bg px-3 py-2 text-xs text-danger-text">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}
            <Input
              placeholder="e.g. uploads, avatars, documents"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="h-9 text-sm font-mono"
              autoFocus
            />
            {name && (
              <p className="text-[11px] text-text-muted font-mono">
                Bucket ID:{" "}
                <span className="text-text-secondary">
                  {name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}
                </span>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="bg-brand hover:bg-brand-hover text-white border-0 gap-1.5"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Create bucket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({
  projectId,
  bucket,
  onUploaded,
  onDismiss,
}: {
  projectId: string;
  bucket: string;
  onUploaded: (file: StorageFile) => void;
  onDismiss: () => void;
}) {
  const [uploads, setUploads] = React.useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const uploadFile = React.useCallback(
    async (item: UploadItem) => {
      setUploads((prev) =>
        prev.map((u) => (u.id === item.id ? { ...u, status: "uploading" } : u)),
      );
      try {
        const form = new FormData();
        form.append("file", item.file);
        form.append("projectId", projectId);
        form.append("bucket", bucket);

        const res = await fetch("/api/internal/storage/upload", {
          method: "POST",
          body: form,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Upload failed (${res.status})`);
        }

        const { key } = await res.json();
        setUploads((prev) =>
          prev.map((u) =>
            u.id === item.id
              ? { ...u, status: "done", progress: 100, uploadedKey: key }
              : u,
          ),
        );
        onUploaded({
          key,
          size: item.file.size,
          last_modified: new Date().toISOString(),
          etag: "",
        });
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === item.id
              ? {
                  ...u,
                  status: "error",
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : u,
          ),
        );
      }
    },
    [projectId, bucket, onUploaded],
  );

  const processFiles = React.useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const newItems: UploadItem[] = Array.from(fileList).map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        status: "idle" as UploadStatus,
        progress: 0,
      }));
      setUploads((prev) => [...prev, ...newItems]);
      newItems.forEach((item) => uploadFile(item));
    },
    [uploadFile],
  );

  const allDone =
    uploads.length > 0 &&
    uploads.every((u) => u.status === "done" || u.status === "error");
  const successCount = uploads.filter((u) => u.status === "done").length;

  return (
    <div className="mx-4 sm:mx-6 my-4 rounded-xl border-2 border-dashed border-border2 bg-background overflow-hidden">
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-8 sm:py-10 cursor-pointer transition-colors",
          isDragging && "bg-brand/5 border-brand",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          processFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface border border-border">
          <CloudUpload className="h-6 w-6 text-text-muted" />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-medium text-text-primary">
            Drop files here or{" "}
            <span className="text-brand underline underline-offset-2">
              browse
            </span>
          </p>
          <p className="text-xs text-text-muted mt-1">
            Files are uploaded securely through the dashboard server
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      {uploads.length > 0 && (
        <div className="border-t border-border divide-y divide-border">
          {uploads.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <FileTypeIcon fileKey={item.file.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary truncate">
                  {item.file.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        item.status === "done"
                          ? "bg-success"
                          : item.status === "error"
                            ? "bg-danger"
                            : "bg-brand",
                      )}
                      style={{
                        width:
                          item.status === "done"
                            ? "100%"
                            : item.status === "uploading"
                              ? "70%"
                              : "0%",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted whitespace-nowrap shrink-0">
                    {formatBytes(item.file.size)}
                  </span>
                </div>
              </div>
              {item.status === "uploading" && (
                <Loader2 className="h-4 w-4 animate-spin text-brand shrink-0" />
              )}
              {item.status === "done" && (
                <Check className="h-4 w-4 text-success shrink-0" />
              )}
              {item.status === "error" && (
                <span title={item.error}>
                  <AlertCircle className="h-4 w-4 text-danger shrink-0" />
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border px-4 py-2.5 bg-surface">
        <p className="text-[11px] text-text-muted">
          {uploads.length === 0
            ? "No files selected"
            : allDone
              ? `${successCount} of ${uploads.length} uploaded`
              : `Uploading…`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-text-muted"
          onClick={onDismiss}
        >
          <X className="h-3.5 w-3.5" />
          {allDone ? "Done" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}

// ─── File List Row ────────────────────────────────────────────────────────────

function FileRow({
  file,
  isSelected,
  onToggleSelect,
  onCopyUrl,
  onDownload,
  onDelete,
  copiedKey,
  deletingKey,
}: {
  file: StorageFile;
  isSelected: boolean;
  onToggleSelect: () => void;
  onCopyUrl: (key: string) => void;
  onDownload: (key: string) => void;
  onDelete: (key: string) => void;
  copiedKey: string | null;
  deletingKey: string | null;
}) {
  const name = getFileName(file.key);
  return (
    <div
      className={cn(
        "group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-border hover:bg-surface transition-colors",
        isSelected && "bg-brand/5",
      )}
    >
      <div
        className="w-7 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
      >
        <input
          type="checkbox"
          className="rounded border-border cursor-pointer"
          checked={isSelected}
          onChange={onToggleSelect}
        />
      </div>
      <FileTypeIcon fileKey={name} size="sm" />
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium text-text-primary truncate"
          title={file.key}
        >
          {name}
        </p>
        <p className="text-[11px] text-text-muted truncate font-mono hidden sm:block">
          {file.key}
        </p>
      </div>
      <div className="hidden md:block text-xs text-text-muted tabular-nums shrink-0 w-16 text-right">
        {formatBytes(file.size)}
      </div>
      <div className="hidden lg:block text-[11.5px] text-text-muted shrink-0 w-28 text-right">
        {formatDateShort(file.last_modified)}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onCopyUrl(file.key)}
        >
          {copiedKey === file.key ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<span />}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onClick={() => onCopyUrl(file.key)}
            >
              <Copy className="h-3.5 w-3.5" /> Copy link
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onClick={() => onDownload(file.key)}
            >
              <Download className="h-3.5 w-3.5" /> Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer text-danger-text focus:text-danger-text"
              onClick={() => onDelete(file.key)}
            >
              {deletingKey === file.key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── File Grid Card ───────────────────────────────────────────────────────────

function FileCard({
  file,
  isSelected,
  onToggleSelect,
  onCopyUrl,
  onDownload,
  onDelete,
  copiedKey,
  deletingKey,
}: {
  file: StorageFile;
  isSelected: boolean;
  onToggleSelect: () => void;
  onCopyUrl: (key: string) => void;
  onDownload: (key: string) => void;
  onDelete: (key: string) => void;
  copiedKey: string | null;
  deletingKey: string | null;
}) {
  const name = getFileName(file.key);
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-background p-3 hover:border-border2 hover:shadow-sm transition-all cursor-pointer",
        isSelected ? "border-brand bg-brand/5" : "border-border",
      )}
      onClick={onToggleSelect}
    >
      <div className="mb-3 flex h-20 sm:h-24 items-center justify-center rounded-lg bg-surface border border-border overflow-hidden">
        <FileTypeIcon fileKey={name} size="lg" />
      </div>
      <p
        className="text-[12.5px] font-medium text-text-primary truncate"
        title={name}
      >
        {name}
      </p>
      <p className="text-[11px] text-text-muted mt-0.5">
        {formatBytes(file.size)}
      </p>

      <div
        className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-text-muted hover:text-text-primary"
          onClick={() => onCopyUrl(file.key)}
        >
          {copiedKey === file.key ? (
            <Check className="h-3 w-3 text-success" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<span />}>
            <button className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-text-muted hover:text-text-primary">
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onClick={() => onCopyUrl(file.key)}
            >
              <Copy className="h-3.5 w-3.5" /> Copy link
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onClick={() => onDownload(file.key)}
            >
              <Download className="h-3.5 w-3.5" /> Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer text-danger-text"
              onClick={() => onDelete(file.key)}
            >
              {deletingKey === file.key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function EmptyFilesState({
  bucket,
  hasSearch,
  onUpload,
}: {
  bucket: string;
  hasSearch: boolean;
  onUpload: () => void;
}) {
  if (hasSearch)
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-text-muted">
        <Search className="h-8 w-8 opacity-30" />
        <p className="text-sm">No files match your search</p>
      </div>
    );

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border2 bg-surface">
        <FolderOpen className="h-7 w-7 text-text-muted" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-text-primary">
          No files in <span className="font-mono text-brand">{bucket}</span>
        </p>
        <p className="text-xs text-text-muted mt-1">
          Upload your first file to get started
        </p>
      </div>
      <Button
        size="sm"
        className="h-8 gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0"
        onClick={onUpload}
      >
        <Upload className="h-3.5 w-3.5" /> Upload files
      </Button>
    </div>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({
  files,
  activeBucket,
}: {
  files: StorageFile[];
  activeBucket: string;
}) {
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const imageCount = files.filter((f) => getFileType(f.key) === "image").length;

  const stats = [
    {
      label: "Files",
      value: String(files.length),
      icon: File,
      bg: "bg-info-bg",
      color: "text-info-text",
    },
    {
      label: "Total size",
      value: formatBytes(totalSize),
      icon: HardDrive,
      bg: "bg-amber-500/10",
      color: "text-amber-500",
    },
    {
      label: "Images",
      value: String(imageCount),
      icon: FileImage,
      bg: "bg-success-bg",
      color: "text-success-text",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-background shrink-0">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-background p-3 sm:p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  "flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-[8px]",
                  s.bg,
                )}
              >
                <Icon className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", s.color)} />
              </div>
              <span className="text-[10px] sm:text-xs text-text-secondary hidden sm:block">
                {s.label}
              </span>
            </div>
            <p className="text-lg sm:text-2xl font-medium text-text-primary leading-none">
              {s.value}
            </p>
            <p className="text-[10px] text-text-muted mt-1 sm:hidden">
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function StorageDashboard({
  projectId,
  userId,
  buckets: initialBuckets,
  activeBucket,
  prefix,
  initialFiles,
  baseUrl,
}: StorageDashboardProps) {
  const router = useRouter();
  const [buckets, setBuckets] = React.useState<BucketInfo[]>(initialBuckets);
  const [files, setFiles] = React.useState<StorageFile[]>(initialFiles);
  const [isLoadingFiles, setIsLoadingFiles] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [showUpload, setShowUpload] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [deletingKey, setDeletingKey] = React.useState<string | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = React.useState<string | null>(
    null,
  );
  const [confirmDeleteSelectedOpen, setConfirmDeleteSelectedOpen] =
    React.useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = React.useState(false);
  const [deleteBucketOpen, setDeleteBucketOpen] = React.useState(false);
  const [deletingBucket, setDeletingBucket] = React.useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
    new Set(),
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    setFiles(initialFiles);
    setSelectedKeys(new Set());
  }, [initialFiles, activeBucket]);
  React.useEffect(() => {
    setBuckets(initialBuckets);
  }, [initialBuckets]);

  const filteredFiles = files.filter(
    (f) =>
      !search ||
      getFileName(f.key).toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase()),
  );

  const handleRefresh = async () => {
    setIsLoadingFiles(true);
    router.refresh();
    setTimeout(() => setIsLoadingFiles(false), 800);
  };

  const handleCopyUrl = async (key: string) => {
    try {
      const res = await fetch("/api/internal/storage/presign-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, bucket: activeBucket, key }),
      });
      if (res.ok) {
        const { url } = await res.json();
        await navigator.clipboard.writeText(url);
      } else {
        await navigator.clipboard.writeText(key);
      }
    } catch {
      await navigator.clipboard.writeText(key);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = async (key: string) => {
    try {
      const res = await fetch("/api/internal/storage/presign-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, bucket: activeBucket, key }),
      });
      if (res.ok) {
        const { url } = await res.json();
        const a = document.createElement("a");
        a.href = url;
        a.download = getFileName(key);
        a.click();
      }
    } catch {
      /* non-fatal */
    }
  };

  const handleDelete = async (key: string) => {
    setDeletingKey(key);
    try {
      const res = await fetch("/api/internal/storage/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, bucket: activeBucket, key }),
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.key !== key));
        setSelectedKeys((prev) => {
          const n = new Set(prev);
          n.delete(key);
          return n;
        });
        setBuckets((prev) =>
          prev.map((b) =>
            b.name === activeBucket
              ? { ...b, file_count: Math.max(0, b.file_count - 1) }
              : b,
          ),
        );
      }
    } finally {
      setDeletingKey(null);
    }
  };

  const requestDeleteFile = (key: string) => {
    setConfirmDeleteKey(key);
  };

  const handleDeleteSelected = async () => {
    if (selectedKeys.size === 0) return;
    setConfirmDeleteSelectedOpen(true);
  };

  const performDeleteSelected = async () => {
    setIsDeletingSelected(true);
    try {
      for (const key of Array.from(selectedKeys)) {
        await handleDelete(key);
      }
      setSelectedKeys(new Set());
    } finally {
      setIsDeletingSelected(false);
      setConfirmDeleteSelectedOpen(false);
    }
  };

  const handleFileUploaded = (file: StorageFile) => {
    setFiles((prev) => [file, ...prev]);
    setBuckets((prev) =>
      prev.map((b) =>
        b.name === activeBucket
          ? {
              ...b,
              file_count: b.file_count + 1,
              total_size: b.total_size + file.size,
            }
          : b,
      ),
    );
  };

  const handleBucketCreated = (name: string) => {
    setBuckets((prev) => [...prev, { name, file_count: 0, total_size: 0 }]);
    router.push(`${baseUrl}?bucket=${name}`);
  };

  const performDeleteBucket = async () => {
    if (!activeBucket) return;
    setDeletingBucket(true);
    try {
      const res = await fetch("/api/internal/storage/buckets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, bucket: activeBucket }),
      });
      if (res.ok) {
        const nextBucket = buckets.find((b) => b.name !== activeBucket)?.name;
        const nextUrl = nextBucket
          ? `${baseUrl}?bucket=${nextBucket}`
          : baseUrl;
        setBuckets((prev) => prev.filter((b) => b.name !== activeBucket));
        router.push(nextUrl);
      }
    } finally {
      setDeletingBucket(false);
      setDeleteBucketOpen(false);
    }
  };

  const currentBucketInfo = buckets.find((b) => b.name === activeBucket);

  return (
    <TooltipProvider>
      <div className="flex flex-1 overflow-hidden">
        {/* ── Desktop Sidebar ── */}
        <aside className="hidden md:flex w-[200px] lg:w-[220px] shrink-0 border-r border-border bg-background flex-col">
          <BucketNav
            buckets={buckets}
            activeBucket={activeBucket}
            baseUrl={baseUrl}
            projectId={projectId}
            onCreated={handleBucketCreated}
          />

          {/* Storage usage */}
          {currentBucketInfo && (
            <div className="border-t border-border p-3">
              <div className="rounded-lg bg-surface border border-border p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">Used</span>
                  <span className="font-medium text-text-primary">
                    {formatBytes(files.reduce((a, f) => a + f.size, 0))}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all w-[15%]" />
                </div>
                <p className="text-[10px] text-text-muted">
                  {currentBucketInfo.file_count} files total
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Stats */}
          <StatsBar files={files} activeBucket={activeBucket} />

          {/* Upload zone */}
          {showUpload && (
            <UploadZone
              projectId={projectId}
              bucket={activeBucket}
              onUploaded={handleFileUploaded}
              onDismiss={() => setShowUpload(false)}
            />
          )}

          {/* Selection bar */}
          {selectedKeys.size > 0 && (
            <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 bg-brand/5 border-b border-brand/20 shrink-0">
              <span className="text-[13px] font-medium text-brand">
                {selectedKeys.size} selected
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setSelectedKeys(new Set())}
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Deselect</span>
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1.5 bg-danger-bg text-danger-text border border-danger-text/20 hover:bg-danger-text/10"
                  onClick={() => setConfirmDeleteSelectedOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete {selectedKeys.size}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 border-b border-border bg-background shrink-0">
            {/* Mobile bucket selector */}
            <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
              <SheetTrigger render={<span />}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 md:hidden shrink-0"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Buckets</SheetTitle>
                </SheetHeader>
                <div className="h-full flex flex-col">
                  <BucketNav
                    buckets={buckets}
                    activeBucket={activeBucket}
                    baseUrl={baseUrl}
                    projectId={projectId}
                    onCreated={handleBucketCreated}
                    onClose={() => setMobileSidebarOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-[13px] text-text-muted min-w-0">
              <span className="font-mono font-medium text-text-primary truncate max-w-[80px] sm:max-w-none">
                {activeBucket}
              </span>
              {prefix && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono truncate">{prefix}</span>
                </>
              )}
            </div>

            <div className="flex-1" />

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
              <Input
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm w-36 lg:w-44"
              />
            </div>

            {/* View toggle - hide on very small */}
            <div className="hidden sm:flex items-center rounded-lg border border-border overflow-hidden">
              {(
                [
                  ["list", List],
                  ["grid", Grid3X3],
                ] as const
              ).map(([mode, Icon]) => (
                <button
                  key={mode}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center transition-colors",
                    viewMode === mode
                      ? "bg-surface text-text-primary"
                      : "text-text-muted hover:text-text-primary",
                  )}
                  onClick={() => setViewMode(mode)}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleRefresh}
              disabled={isLoadingFiles}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isLoadingFiles && "animate-spin")}
              />
            </Button>

            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0 shrink-0"
              onClick={() => setShowUpload((s) => !s)}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </Button>

            <AlertDialog
              open={deleteBucketOpen}
              onOpenChange={setDeleteBucketOpen}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-danger border-danger hover:bg-danger/5 shrink-0"
                disabled={!activeBucket}
                onClick={() => setDeleteBucketOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete bucket</span>
              </Button>
              <AlertDialogContent className="max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete bucket</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete the bucket{" "}
                    <span className="font-mono">{activeBucket}</span> and all
                    files stored inside. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    size="sm"
                    className="h-8"
                    onClick={performDeleteBucket}
                    disabled={!activeBucket || deletingBucket}
                  >
                    {deletingBucket ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Delete bucket"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Mobile search */}
          <div className="sm:hidden px-3 py-2 border-b border-border bg-background shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
              <Input
                placeholder="Search files…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm w-full"
              />
            </div>
          </div>

          {/* File content */}
          <div className="flex-1 overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <EmptyFilesState
                bucket={activeBucket}
                hasSearch={!!search}
                onUpload={() => setShowUpload(true)}
              />
            ) : viewMode === "list" ? (
              <div>
                {/* Table header */}
                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-border bg-surface sticky top-0">
                  <div className="w-7 shrink-0">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={
                        selectedKeys.size === filteredFiles.length &&
                        filteredFiles.length > 0
                      }
                      onChange={(e) =>
                        setSelectedKeys(
                          e.target.checked
                            ? new Set(filteredFiles.map((f) => f.key))
                            : new Set(),
                        )
                      }
                    />
                  </div>
                  <div className="w-8 shrink-0" />
                  <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    Name
                  </span>
                  <span className="hidden md:block text-[11px] font-semibold uppercase tracking-wider text-text-muted w-16 text-right">
                    Size
                  </span>
                  <span className="hidden lg:block text-[11px] font-semibold uppercase tracking-wider text-text-muted w-28 text-right">
                    Modified
                  </span>
                  <div className="w-16" />
                </div>
                {filteredFiles.map((file) => (
                  <FileRow
                    key={file.key}
                    file={file}
                    isSelected={selectedKeys.has(file.key)}
                    onToggleSelect={() =>
                      setSelectedKeys((prev) => {
                        const n = new Set(prev);
                        n.has(file.key) ? n.delete(file.key) : n.add(file.key);
                        return n;
                      })
                    }
                    onCopyUrl={handleCopyUrl}
                    onDownload={handleDownload}
                    onDelete={requestDeleteFile}
                    copiedKey={copiedKey}
                    deletingKey={deletingKey}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.key}
                    file={file}
                    isSelected={selectedKeys.has(file.key)}
                    onToggleSelect={() =>
                      setSelectedKeys((prev) => {
                        const n = new Set(prev);
                        n.has(file.key) ? n.delete(file.key) : n.add(file.key);
                        return n;
                      })
                    }
                    onCopyUrl={handleCopyUrl}
                    onDownload={handleDownload}
                    onDelete={requestDeleteFile}
                    copiedKey={copiedKey}
                    deletingKey={deletingKey}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredFiles.length > 0 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-border bg-background shrink-0 text-xs text-text-muted">
              <span>
                {filteredFiles.length}{" "}
                {filteredFiles.length === 1 ? "file" : "files"}
                {search && ` matching "${search}"`}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1.5 text-text-muted"
                onClick={() => setShowUpload(true)}
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Upload more</span>
              </Button>
            </div>
          )}
        </main>

        <AlertDialog
          open={Boolean(confirmDeleteKey)}
          onOpenChange={(open) => {
            if (!open) setConfirmDeleteKey(null);
          }}
        >
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete file</AlertDialogTitle>
              <AlertDialogDescription>
                {`Are you sure you want to delete "${getFileName(
                  confirmDeleteKey ?? "",
                )}"? This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                size="sm"
                className="h-8"
                onClick={() => {
                  if (confirmDeleteKey) {
                    handleDelete(confirmDeleteKey);
                    setConfirmDeleteKey(null);
                  }
                }}
                disabled={!confirmDeleteKey}
              >
                Delete file
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={confirmDeleteSelectedOpen}
          onOpenChange={setConfirmDeleteSelectedOpen}
        >
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected files</AlertDialogTitle>
              <AlertDialogDescription>
                {`Delete ${selectedKeys.size} selected file(s)? This cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                size="sm"
                className="h-8"
                onClick={performDeleteSelected}
                disabled={isDeletingSelected}
              >
                {isDeletingSelected ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Delete files"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
