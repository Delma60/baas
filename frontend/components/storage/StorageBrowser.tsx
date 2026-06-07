// frontend/components/storage/StorageBrowser.tsx
"use client";

import * as React from "react";
import {
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileCode,
  Archive,
  Upload,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  X,
  Check,
  Loader2,
  FolderOpen,
  ChevronRight,
  CloudUpload,
  AlertCircle,
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface StorageFile {
  key: string;
  size: number;
  last_modified: string;
  etag: string;
}

interface StorageBrowserProps {
  projectId: string;
  userId: string;
  bucket: string;
  prefix: string;
  files: StorageFile[];
  baseUrl: string;
}

type ViewMode = "grid" | "list";
type UploadStatus = "idle" | "uploading" | "done" | "error";

interface UploadItem {
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

function getFileType(
  key: string,
): "image" | "video" | "audio" | "document" | "code" | "archive" | "other" {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext))
    return "image";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "flac"].includes(ext)) return "audio";
  if (
    ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md"].includes(
      ext,
    )
  )
    return "document";
  if (
    [
      "js",
      "ts",
      "py",
      "go",
      "rs",
      "java",
      "json",
      "yaml",
      "yml",
      "toml",
    ].includes(ext)
  )
    return "code";
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return "archive";
  return "other";
}

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  code: FileCode,
  archive: Archive,
  other: File,
};

const FILE_TYPE_COLORS: Record<string, string> = {
  image: "text-emerald-500",
  video: "text-violet-500",
  audio: "text-pink-500",
  document: "text-blue-500",
  code: "text-amber-500",
  archive: "text-orange-500",
  other: "text-[--text-muted]",
};

const FILE_TYPE_BG: Record<string, string> = {
  image: "bg-emerald-500/10",
  video: "bg-violet-500/10",
  audio: "bg-pink-500/10",
  document: "bg-blue-500/10",
  code: "bg-amber-500/10",
  archive: "bg-orange-500/10",
  other: "bg-[--surface]",
};

function getFileName(key: string): string {
  return key.split("/").pop() ?? key;
}

// ─── File Icon ────────────────────────────────────────────────────────────────

function FileIcon({
  fileKey,
  size = "default",
}: {
  fileKey: string;
  size?: "sm" | "default" | "lg";
}) {
  const type = getFileType(fileKey);
  const Icon = FILE_TYPE_ICONS[type];
  const color = FILE_TYPE_COLORS[type];
  const bg = FILE_TYPE_BG[type];
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-14 w-14",
  };
  const iconSizes = { sm: "h-4 w-4", default: "h-5 w-5", lg: "h-7 w-7" };
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        sizeClasses[size],
        bg,
      )}
    >
      <Icon className={cn(iconSizes[size], color)} />
    </div>
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
  onUploaded: (key: string) => void;
  onDismiss: () => void;
}) {
  const [uploads, setUploads] = React.useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newItems: UploadItem[] = Array.from(fileList).map((file) => ({
      file,
      status: "idle",
      progress: 0,
    }));
    setUploads((prev) => [...prev, ...newItems]);
    newItems.forEach((_, i) => uploadFile(uploads.length + i, fileList[i]));
  };

  const uploadFile = async (idx: number, file: File) => {
    // Update status to uploading
    setUploads((prev) =>
      prev.map((u, i) => (i === idx ? { ...u, status: "uploading" } : u)),
    );

    try {
      // 1. Get presigned upload URL from our Next.js API route
      const presignRes = await fetch(`/api/internal/storage/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          bucket,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!presignRes.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, key } = await presignRes.json();

      // 2. Upload directly to MinIO via presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      setUploads((prev) =>
        prev.map((u, i) =>
          i === idx
            ? { ...u, status: "done", progress: 100, uploadedKey: key }
            : u,
        ),
      );
      onUploaded(key);
    } catch (err) {
      setUploads((prev) =>
        prev.map((u, i) =>
          i === idx
            ? {
                ...u,
                status: "error",
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : u,
        ),
      );
    }
  };

  const allDone =
    uploads.length > 0 &&
    uploads.every((u) => u.status === "done" || u.status === "error");

  return (
    <div className="mx-6 my-4 rounded-xl border-2 border-dashed border-[--border2] bg-[--background] overflow-hidden">
      {/* Drop area */}
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-10 transition-colors cursor-pointer",
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
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[--surface] border border-[--border]">
          <CloudUpload className="h-6 w-6 text-[--text-muted]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[--text-primary]">
            Drop files here or{" "}
            <span className="text-brand underline underline-offset-2 cursor-pointer">
              browse
            </span>
          </p>
          <p className="text-xs text-[--text-muted] mt-1">
            Files are uploaded directly to MinIO via presigned URL
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

      {/* Upload progress list */}
      {uploads.length > 0 && (
        <div className="border-t border-[--border] divide-y divide-[--border]">
          {uploads.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <FileIcon fileKey={item.file.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[--text-primary] truncate">
                  {item.file.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 rounded-full bg-[--border] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        item.status === "done"
                          ? "bg-[--success]"
                          : item.status === "error"
                            ? "bg-[--danger]"
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
                  <span className="text-[10px] text-[--text-muted] whitespace-nowrap">
                    {formatBytes(item.file.size)}
                  </span>
                </div>
              </div>
              {item.status === "uploading" && (
                <Loader2 className="h-4 w-4 animate-spin text-brand shrink-0" />
              )}
              {item.status === "done" && (
                <Check className="h-4 w-4 text-[--success] shrink-0" />
              )}
              {item.status === "error" && (
                <Tooltip>
                  <TooltipTrigger render={<span />}>
                    <AlertCircle className="h-4 w-4 text-[--danger] shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>{item.error}</TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-[--border] px-4 py-2.5 bg-[--surface]">
        <p className="text-[11px] text-[--text-muted]">
          {uploads.length === 0
            ? "No files selected"
            : allDone
              ? `${uploads.filter((u) => u.status === "done").length} of ${uploads.length} uploaded`
              : `Uploading ${uploads.filter((u) => u.status === "uploading").length} files…`}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-[--text-muted] gap-1"
          onClick={onDismiss}
        >
          <X className="h-3.5 w-3.5" />
          {allDone ? "Done" : "Cancel"}
        </Button>
      </div>
    </div>
  );
}

// ─── File row (list view) ─────────────────────────────────────────────────────

function FileRow({
  file,
  onDelete,
  onCopyUrl,
  copiedKey,
}: {
  file: StorageFile;
  onDelete: (key: string) => void;
  onCopyUrl: (key: string) => void;
  copiedKey: string | null;
}) {
  const name = getFileName(file.key);
  return (
    <div className="group flex items-center gap-3 px-4 py-3 border-b border-[--border] hover:bg-[--surface] transition-colors">
      <FileIcon fileKey={name} size="sm" />
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium text-[--text-primary] truncate"
          title={file.key}
        >
          {name}
        </p>
        <p className="text-[11px] text-[--text-muted] truncate font-mono">
          {file.key}
        </p>
      </div>
      <div className="hidden sm:block text-xs text-[--text-muted] tabular-nums shrink-0 w-20 text-right">
        {formatBytes(file.size)}
      </div>
      <div className="hidden md:block text-[11.5px] text-[--text-muted] shrink-0 w-36 text-right">
        {formatDate(file.last_modified)}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onCopyUrl(file.key)}
            >
              {copiedKey === file.key ? (
                <Check className="h-3.5 w-3.5 text-[--success]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy presigned URL</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger render={<span />}>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onCopyUrl(file.key)}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2">
              <Download className="h-3.5 w-3.5" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 text-[--danger] focus:text-[--danger]"
              onClick={() => onDelete(file.key)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── File card (grid view) ────────────────────────────────────────────────────

function FileCard({
  file,
  onDelete,
  onCopyUrl,
  copiedKey,
}: {
  file: StorageFile;
  onDelete: (key: string) => void;
  onCopyUrl: (key: string) => void;
  copiedKey: string | null;
}) {
  const name = getFileName(file.key);
  const type = getFileType(name);

  return (
    <div className="group relative rounded-xl border border-[--border] bg-[--background] p-3 hover:border-[--border2] hover:shadow-sm transition-all">
      {/* Thumbnail / icon */}
      <div className="mb-3 flex h-24 items-center justify-center rounded-lg bg-[--surface] border border-[--border] overflow-hidden">
        {type === "image" ? (
          // In production, render an actual img with a presigned URL
          <div className="flex flex-col items-center gap-1.5">
            <FileImage className="h-8 w-8 text-emerald-400" />
            <span className="text-[10px] text-[--text-muted] font-mono uppercase">
              {name.split(".").pop()}
            </span>
          </div>
        ) : (
          <FileIcon fileKey={name} size="lg" />
        )}
      </div>

      {/* Info */}
      <p
        className="text-[12.5px] font-medium text-[--text-primary] truncate"
        title={name}
      >
        {name}
      </p>
      <p className="text-[11px] text-[--text-muted] mt-0.5">
        {formatBytes(file.size)}
      </p>

      {/* Actions overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <button
              className="flex h-6 w-6 items-center justify-center rounded border border-[--border] bg-[--background] text-[--text-muted] hover:text-[--text-primary] transition-colors"
              onClick={() => onCopyUrl(file.key)}
            >
              {copiedKey === file.key ? (
                <Check className="h-3 w-3 text-[--success]" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Copy URL</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger render={<span />}>
            <button className="flex h-6 w-6 items-center justify-center rounded border border-[--border] bg-[--background] text-[--text-muted] hover:text-[--text-primary] transition-colors">
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onCopyUrl(file.key)}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs gap-2">
              <Download className="h-3.5 w-3.5" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 text-[--danger] focus:text-[--danger]"
              onClick={() => onDelete(file.key)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Main browser component ───────────────────────────────────────────────────

export function StorageBrowser({
  projectId,
  userId,
  bucket,
  prefix,
  files: initialFiles,
  baseUrl,
}: StorageBrowserProps) {
  const [files, setFiles] = React.useState<StorageFile[]>(initialFiles);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [showUpload, setShowUpload] = React.useState(false);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const [deletingKeys, setDeletingKeys] = React.useState<Set<string>>(
    new Set(),
  );
  const [selectedFiles, setSelectedFiles] = React.useState<Set<string>>(
    new Set(),
  );

  // Sync files when server re-renders (bucket change)
  React.useEffect(() => {
    setFiles(initialFiles);
  }, [initialFiles]);

  const filteredFiles = files.filter(
    (f) =>
      !search ||
      getFileName(f.key).toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase()),
  );

  const handleCopyUrl = async (key: string) => {
    try {
      const res = await fetch(`/api/internal/storage/presign-download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, bucket, key }),
      });
      if (res.ok) {
        const { url } = await res.json();
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback: copy the path
        await navigator.clipboard.writeText(`${bucket}/${key}`);
      }
    } catch {
      await navigator.clipboard.writeText(`${bucket}/${key}`);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete "${getFileName(key)}"? This cannot be undone.`))
      return;
    setDeletingKeys((prev) => new Set([...prev, key]));
    try {
      const res = await fetch(`/api/internal/storage/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, bucket, key }),
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.key !== key));
        setSelectedFiles((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    } finally {
      setDeletingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleUploaded = (key: string) => {
    // Add the newly uploaded file to the list (optimistic)
    const newFile: StorageFile = {
      key,
      size: 0,
      last_modified: new Date().toISOString(),
      etag: "",
    };
    setFiles((prev) => [newFile, ...prev]);
  };

  // Group by file type for stats
  const typeBreakdown = files.reduce(
    (acc, f) => {
      const t = getFileType(getFileName(f.key));
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[--border] bg-[--background] shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-[13px] text-[--text-muted]">
            <span className="font-mono font-medium text-[--text-primary]">
              {bucket}
            </span>
            {prefix && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-mono">{prefix}</span>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[--text-muted] pointer-events-none" />
            <Input
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm w-48 focus:w-64 transition-all"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-[--border] overflow-hidden">
            <button
              className={cn(
                "flex h-8 w-8 items-center justify-center transition-colors",
                viewMode === "list"
                  ? "bg-[--surface] text-[--text-primary]"
                  : "text-[--text-muted] hover:text-[--text-primary]",
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              className={cn(
                "flex h-8 w-8 items-center justify-center transition-colors",
                viewMode === "grid"
                  ? "bg-[--surface] text-[--text-primary]"
                  : "text-[--text-muted] hover:text-[--text-primary]",
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0"
            onClick={() => setShowUpload((s) => !s)}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>

        {/* Upload zone */}
        {showUpload && (
          <UploadZone
            projectId={projectId}
            bucket={bucket}
            onUploaded={handleUploaded}
            onDismiss={() => setShowUpload(false)}
          />
        )}

        {/* Selected actions bar */}
        {selectedFiles.size > 0 && (
          <div className="flex items-center gap-3 px-6 py-2.5 bg-brand/5 border-b border-brand/20 shrink-0">
            <span className="text-[13px] font-medium text-brand">
              {selectedFiles.size} selected
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setSelectedFiles(new Set())}
              >
                <X className="h-3.5 w-3.5" />
                Deselect
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs gap-1.5 bg-[--danger-bg] text-[--danger] border-[--danger]/30 hover:bg-[--danger]/10"
                onClick={async () => {
                  for (const key of selectedFiles) await handleDelete(key);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete selected
              </Button>
            </div>
          </div>
        )}

        {/* Files area */}
        <div className="flex-1 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <EmptyState
              hasSearch={!!search}
              bucket={bucket}
              onUpload={() => setShowUpload(true)}
            />
          ) : viewMode === "list" ? (
            <div>
              {/* Table header */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[--border] bg-[--surface] sticky top-0">
                <div className="w-8 shrink-0">
                  <input
                    type="checkbox"
                    className="rounded border-[--border]"
                    checked={
                      selectedFiles.size === filteredFiles.length &&
                      filteredFiles.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFiles(
                          new Set(filteredFiles.map((f) => f.key)),
                        );
                      } else {
                        setSelectedFiles(new Set());
                      }
                    }}
                  />
                </div>
                <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-[--text-muted]">
                  Name
                </span>
                <span className="hidden sm:block text-[11px] font-semibold uppercase tracking-wider text-[--text-muted] w-20 text-right">
                  Size
                </span>
                <span className="hidden md:block text-[11px] font-semibold uppercase tracking-wider text-[--text-muted] w-36 text-right">
                  Modified
                </span>
                <div className="w-16" />
              </div>

              {filteredFiles.map((file) => (
                <div
                  key={file.key}
                  className="group flex items-center gap-3 px-4 py-3 border-b border-[--border] hover:bg-[--surface] transition-colors"
                >
                  <div className="w-8 shrink-0">
                    <input
                      type="checkbox"
                      className="rounded border-[--border] opacity-0 group-hover:opacity-100 transition-opacity"
                      checked={selectedFiles.has(file.key)}
                      onChange={(e) => {
                        setSelectedFiles((prev) => {
                          const next = new Set(prev);
                          e.target.checked
                            ? next.add(file.key)
                            : next.delete(file.key);
                          return next;
                        });
                      }}
                    />
                  </div>
                  <FileRow
                    file={file}
                    onDelete={handleDelete}
                    onCopyUrl={handleCopyUrl}
                    copiedKey={copiedKey}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.key}
                  file={file}
                  onDelete={handleDelete}
                  onCopyUrl={handleCopyUrl}
                  copiedKey={copiedKey}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {filteredFiles.length > 0 && (
          <div className="flex items-center justify-between px-6 py-2.5 border-t border-[--border] bg-[--background] shrink-0 text-xs text-[--text-muted]">
            <span>
              {filteredFiles.length}{" "}
              {filteredFiles.length === 1 ? "file" : "files"}
              {search && ` matching "${search}"`}
            </span>
            <div className="flex items-center gap-3">
              {Object.entries(typeBreakdown)
                .filter(([_, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([type, count]) => {
                  const Icon = FILE_TYPE_ICONS[type];
                  return (
                    <span key={type} className="flex items-center gap-1">
                      <Icon className={cn("h-3 w-3", FILE_TYPE_COLORS[type])} />
                      {count}
                    </span>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  hasSearch,
  bucket,
  onUpload,
}: {
  hasSearch: boolean;
  bucket: string;
  onUpload: () => void;
}) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-[--text-muted]">
        <Search className="h-8 w-8 opacity-30" />
        <p className="text-sm">No files match your search</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-[--border2] bg-[--surface]">
        <FolderOpen className="h-7 w-7 text-[--text-muted]" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[--text-primary]">
          No files in <span className="font-mono text-brand">{bucket}</span>
        </p>
        <p className="text-xs text-[--text-muted] mt-1">
          Upload your first file to get started
        </p>
      </div>
      <Button
        size="sm"
        className="h-8 gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0 mt-1"
        onClick={onUpload}
      >
        <Upload className="h-3.5 w-3.5" />
        Upload files
      </Button>

      {/* SDK snippet */}
      <div className="mt-4 rounded-xl border border-[--border] bg-[--surface] px-5 py-4 max-w-sm w-full">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[--text-muted] mb-2">
          Upload via SDK
        </p>
        <pre className="text-[11.5px] font-mono text-[--text-secondary] leading-relaxed overflow-x-auto">
          <code>{`const { uploadUrl, fileUrl } = await baas
  .storage('${bucket}')
  .upload({
    filename: 'photo.jpg',
    contentType: 'image/jpeg',
  })

// PUT directly to MinIO
await fetch(uploadUrl, {
  method: 'PUT',
  body: fileBlob,
})`}</code>
        </pre>
      </div>
    </div>
  );
}
