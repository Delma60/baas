// frontend/components/nosql/NoSQLPageClient.tsx
"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Layers,
  Key,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ChevronRight,
  Copy,
  Check,
  FileJson,
  Hash,
  ToggleLeft,
  Type,
  X,
  Loader2,
  MoreHorizontal,
  FolderOpen,
  Eye,
  ChevronDown,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoSQLPageClientProps {
  userId: string;
  projectId: string;
  mongoDatabase: string;
  initialTab: string;
  initialCollection?: string;
  collections: string[];
  kvKeys: KVEntry[];
  initialDocs: any[] | null;
  initialTotal: number;
}

interface KVEntry {
  key: string;
  value: any;
  expires_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value;
}

const TYPE_COLORS: Record<string, string> = {
  string: "text-amber-600 dark:text-amber-400",
  number: "text-violet-600 dark:text-violet-400",
  boolean: "text-sky-600 dark:text-sky-400",
  null: "text-rose-500",
  array: "text-emerald-600 dark:text-emerald-400",
  object: "text-brand",
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  null: X,
  array: Layers,
  object: FileJson,
};

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object") {
    const entries = Object.keys(value as object).length;
    return Array.isArray(value)
      ? `[${(value as any[]).length} items]`
      : `{${entries} fields}`;
  }
  return String(value);
}

function truncate(str: string, max = 60): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── Proxy helper (all NoSQL dashboard calls go through nosql-proxy) ──────────

async function proxyFetch(path: string, init?: RequestInit) {
  const res = await fetch(`/api/nosql-proxy${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b?.detail ?? b?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Document Card ────────────────────────────────────────────────────────────

function DocumentCard({
  doc,
  onSelect,
  onDelete,
  isSelected,
}: {
  doc: any;
  onSelect: () => void;
  onDelete: () => void;
  isSelected: boolean;
}) {
  const fields = Object.entries(doc).filter(([k]) => k !== "id");
  const preview = fields.slice(0, 3);

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border cursor-pointer transition-all duration-150 hover:-translate-y-px",
        isSelected
          ? "border-brand/50 bg-brand/5 shadow-sm shadow-brand/10"
          : "border-border bg-background hover:border-border2 hover:shadow-sm",
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <code className="text-[11px] font-mono text-text-muted bg-surface border border-border px-2 py-0.5 rounded-md truncate max-w-[200px]">
            {String(doc.id ?? "").slice(0, 24)}
          </code>
          <DropdownMenu>
            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                className="text-xs gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                <Eye className="h-3.5 w-3.5" /> View document
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2 text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1.5">
          {preview.map(([k, v]) => {
            const type = getValueType(v);
            const TypeIcon = TYPE_ICONS[type] ?? FileJson;
            return (
              <div key={k} className="flex items-center gap-2 text-[12px]">
                <TypeIcon
                  className={cn("h-3 w-3 shrink-0", TYPE_COLORS[type])}
                />
                <span className="text-text-secondary font-medium shrink-0">
                  {k}:
                </span>
                <span className={cn("truncate font-mono", TYPE_COLORS[type])}>
                  {truncate(formatValue(v), 40)}
                </span>
              </div>
            );
          })}
          {fields.length > 3 && (
            <p className="text-[11px] text-text-muted pl-5">
              +{fields.length - 3} more fields
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── JSON viewer ──────────────────────────────────────────────────────────────

function JsonViewer({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [expanded, setExpanded] = React.useState(depth < 2);
  const type = getValueType(data);
  const isExpandable = type === "object" || type === "array";

  if (!isExpandable) {
    return (
      <span className={cn("font-mono text-[12px]", TYPE_COLORS[type])}>
        {formatValue(data)}
      </span>
    );
  }

  const entries = Array.isArray(data)
    ? (data as any[]).map((v, i) => [String(i), v])
    : Object.entries(data as Record<string, unknown>);

  return (
    <div>
      <button
        onClick={() => setExpanded((o) => !o)}
        className="flex items-center gap-1 text-[12px] text-text-muted hover:text-text-primary transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <span className="text-brand font-mono">
          {type === "array"
            ? `[${(data as any[]).length}]`
            : `{${entries.length}}`}
        </span>
      </button>
      {expanded && (
        <div className="ml-4 border-l border-border pl-3 mt-1 space-y-0.5">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-start gap-2 py-0.5">
              <span className="text-[12px] font-medium text-text-secondary shrink-0 pt-px">
                {Array.isArray(data) ? (
                  <span className="text-text-muted">{k}</span>
                ) : (
                  k
                )}
                :
              </span>
              <JsonViewer data={v} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Document Detail Panel ────────────────────────────────────────────────────

function DocumentDetailPanel({
  doc,
  onClose,
}: {
  doc: any;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-2">
          <FileJson className="h-4 w-4 text-brand" />
          <span className="text-[13px] font-medium text-text-primary">
            Document
          </span>
          <code className="text-[11px] font-mono text-text-muted bg-background border border-border px-1.5 py-0.5 rounded-md">
            {String(doc.id ?? "").slice(0, 16)}…
          </code>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy JSON</TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-1">
          {Object.entries(doc).map(([k, v]) => {
            const type = getValueType(v);
            const TypeIcon = TYPE_ICONS[type] ?? FileJson;
            return (
              <div
                key={k}
                className="rounded-lg hover:bg-surface transition-colors px-2 py-1.5"
              >
                <div className="flex items-start gap-2">
                  <TypeIcon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 mt-0.5",
                      TYPE_COLORS[type],
                    )}
                  />
                  <span className="text-[12px] font-semibold text-text-primary shrink-0">
                    {k}
                  </span>
                  <div className="flex-1 min-w-0">
                    <JsonViewer data={v} depth={0} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── KV Entry Row ─────────────────────────────────────────────────────────────

function KVRow({ entry, onDelete }: { entry: KVEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const type = getValueType(entry.value);
  const TypeIcon = TYPE_ICONS[type] ?? FileJson;
  const isExpandable = type === "object" || type === "array";

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(entry.key));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className={cn(
        "border-b border-border/60 last:border-0 transition-colors",
        expanded ? "bg-surface/50" : "hover:bg-surface/30",
      )}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => isExpandable && setExpanded((o) => !o)}
      >
        {isExpandable ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-text-muted shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" />
          )
        ) : (
          <TypeIcon className={cn("h-3.5 w-3.5 shrink-0", TYPE_COLORS[type])} />
        )}

        <code className="text-[12.5px] font-mono text-text-primary flex-1 truncate">
          {entry.key}
        </code>

        {!isExpandable && (
          <span
            className={cn(
              "text-[12px] font-mono truncate max-w-[200px]",
              TYPE_COLORS[type],
            )}
          >
            {formatValue(entry.value)}
          </span>
        )}

        {entry.expires_at && (
          <span className="flex items-center gap-1 text-[11px] text-warn-text bg-warn-bg rounded-full px-2 py-0.5 shrink-0">
            <Clock className="h-2.5 w-2.5" />
            TTL
          </span>
        )}

        <Badge
          variant="outline"
          className="text-[10px] h-5 px-1.5 shrink-0 font-mono"
        >
          {type}
        </Badge>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            aria-label="Copy key"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete key"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {expanded && isExpandable && (
        <div className="px-10 pb-3">
          <div className="rounded-lg bg-code-bg border border-border p-3 font-mono text-[12px] text-code-text">
            <JsonViewer data={entry.value} depth={0} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Create Collection Dialog ─────────────────────────────────────────────────

function CreateCollectionDialog({
  open,
  onClose,
  onCreated,
  projectId,
  mongoDatabase,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
  projectId: string;
  mongoDatabase: string;
}) {
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/nosql/collections?mongo_database=${encodeURIComponent(mongoDatabase)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ collection: name.trim() }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.detail ?? data?.error ?? "Failed to create collection");
        return;
      }
      onCreated(name.trim());
      setName("");
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>
            Create a MongoDB collection. Names must start with a letter or
            number.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Collection name</Label>
            <Input
              placeholder="e.g. posts, orders, events"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="h-9 font-mono text-sm"
              autoFocus
            />
          </div>
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            className="bg-brand text-white hover:bg-brand-hover border-0 gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Insert Document Dialog ───────────────────────────────────────────────────

function InsertDocumentDialog({
  open,
  onClose,
  onInserted,
  projectId,
  mongoDatabase,
  collection,
}: {
  open: boolean;
  onClose: () => void;
  onInserted: (doc: any) => void;
  projectId: string;
  mongoDatabase: string;
  collection: string;
}) {
  const [json, setJson] = React.useState("{\n  \n}");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleInsert = async () => {
    setError("");
    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch {
      setError("Invalid JSON — check your syntax.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/nosql/collections/${collection}/documents?mongo_database=${encodeURIComponent(mongoDatabase)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.detail ?? data?.error ?? "Insert failed");
        return;
      }
      onInserted(data.data ?? data);
      setJson("{\n  \n}");
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Insert document</DialogTitle>
          <DialogDescription>
            Paste or type valid JSON. The document will be inserted into{" "}
            <code className="text-brand">{collection}</code>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            className="w-full h-48 rounded-lg border border-border bg-code-bg font-mono text-[12.5px] text-code-text p-3 outline-none resize-none focus:border-brand transition-colors"
            spellCheck={false}
          />
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleInsert}
            disabled={loading}
            className="bg-brand text-white hover:bg-brand-hover border-0 gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Set KV Dialog ────────────────────────────────────────────────────────────

function SetKVDialog({
  open,
  onClose,
  onSet,
  projectId,
  mongoDatabase,
}: {
  open: boolean;
  onClose: () => void;
  onSet: (entry: KVEntry) => void;
  projectId: string;
  mongoDatabase: string;
}) {
  const [key, setKey] = React.useState("");
  const [valueStr, setValueStr] = React.useState("");
  const [ttl, setTtl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSet = async () => {
    if (!key.trim()) {
      setError("Key is required");
      return;
    }
    setError("");
    let value: any;
    try {
      value = JSON.parse(valueStr);
    } catch {
      value = valueStr; // treat as plain string
    }
    setLoading(true);
    try {
      // Use the internal proxy — no API key needed in the dashboard
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/nosql/kv/${encodeURIComponent(key.trim())}?mongo_database=${encodeURIComponent(mongoDatabase)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value, ttl: ttl ? parseInt(ttl) : null }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.detail ?? data?.error ?? "Failed to set key");
        return;
      }
      onSet({
        key: key.trim(),
        value,
        expires_at: ttl
          ? new Date(Date.now() + parseInt(ttl) * 1000).toISOString()
          : null,
      });
      setKey("");
      setValueStr("");
      setTtl("");
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set key-value pair</DialogTitle>
          <DialogDescription>
            Values can be any JSON type: string, number, boolean, object, or
            array.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Key</Label>
            <Input
              placeholder="user:prefs:theme"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="h-9 font-mono text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Value (JSON or plain string)
            </Label>
            <Input
              placeholder='"dark" or 42 or {"enabled": true}'
              value={valueStr}
              onChange={(e) => setValueStr(e.target.value)}
              className="h-9 font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              TTL in seconds{" "}
              <span className="font-normal text-text-muted">(optional)</span>
            </Label>
            <Input
              placeholder="3600"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              type="number"
              className="h-9"
            />
          </div>
          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSet}
            disabled={loading || !key.trim()}
            className="bg-brand text-white hover:bg-brand-hover border-0 gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Set
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Collections Tab ──────────────────────────────────────────────────────────

function CollectionsTab({
  projectId,
  mongoDatabase,
  collections: initialCollections,
  initialDocs,
  initialTotal,
  initialCollection,
}: {
  projectId: string;
  mongoDatabase: string;
  collections: string[];
  initialDocs: any[] | null;
  initialTotal: number;
  initialCollection?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [collections, setCollections] = React.useState(initialCollections);
  const [activeCollection, setActiveCollection] = React.useState<string | null>(
    initialCollection ?? initialCollections[0] ?? null,
  );
  const [docs, setDocs] = React.useState<any[]>(initialDocs ?? []);
  const [total, setTotal] = React.useState(initialTotal);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const [loadingCollections, setLoadingCollections] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedDoc, setSelectedDoc] = React.useState<any | null>(null);
  const [createCollOpen, setCreateCollOpen] = React.useState(false);
  const [insertDocOpen, setInsertDocOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    type: "collection" | "doc";
    id: string;
    label: string;
  } | null>(null);

  const filteredCollections = collections.filter(
    (c) => !search || c.toLowerCase().includes(search.toLowerCase()),
  );

  const refreshCollections = async () => {
    setLoadingCollections(true);
    try {
      const res = await fetch(
        `/api/internal/nosql/collections?projectId=${projectId}&mongo_database=${encodeURIComponent(mongoDatabase)}`,
      );
      const data = await res.json();
      if (res.ok) {
        const list: string[] = data?.data?.collections ?? [];
        setCollections(list);
      }
    } catch {}
    setLoadingCollections(false);
  };

  const loadDocs = async (coll: string) => {
    setLoadingDocs(true);
    setSelectedDoc(null);
    setDocs([]);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/nosql/collections/${coll}/documents?mongo_database=${encodeURIComponent(mongoDatabase)}&limit=50&skip=0`,
      );
      const json = await res.json();
      setDocs(json.data?.docs ?? []);
      setTotal(json.data?.total ?? 0);
    } catch {
      setDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const selectCollection = (coll: string) => {
    setActiveCollection(coll);
    loadDocs(coll);
    router.replace(`${pathname}?tab=collections&collection=${coll}`, {
      scroll: false,
    });
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!activeCollection) return;
    try {
      await fetch(
        `/api/nosql-proxy/projects/${projectId}/nosql/collections/${activeCollection}/documents/${docId}?mongo_database=${encodeURIComponent(mongoDatabase)}`,
        { method: "DELETE" },
      );
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      setTotal((t) => t - 1);
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch {}
  };

  const handleDeleteCollection = async (coll: string) => {
    try {
      await fetch(
        `/api/nosql-proxy/projects/${projectId}/nosql/collections/${coll}?mongo_database=${encodeURIComponent(mongoDatabase)}`,
        { method: "DELETE" },
      );
      const updated = collections.filter((c) => c !== coll);
      setCollections(updated);
      if (activeCollection === coll) {
        if (updated.length > 0) selectCollection(updated[0]);
        else {
          setActiveCollection(null);
          setDocs([]);
          setTotal(0);
        }
      }
    } catch {}
    setDeleteConfirm(null);
  };

  // After creating a collection, update local state AND re-fetch from server
  const handleCollectionCreated = async (name: string) => {
    // Optimistically add to list
    setCollections((prev) => [...prev, name].sort());
    // Select it immediately
    setActiveCollection(name);
    setDocs([]);
    setTotal(0);
    router.replace(`${pathname}?tab=collections&collection=${name}`, {
      scroll: false,
    });
    // Also trigger server component refresh so next navigation is consistent
    router.refresh();
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 flex flex-col border-r border-border bg-surface/40 overflow-hidden">
        <div className="p-2 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Filter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background text-text-primary placeholder:text-text-muted outline-none focus:border-brand transition-colors"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-1.5">
          <div className="space-y-0.5">
            {loadingCollections ? (
              <div className="flex items-center justify-center py-8 gap-2 text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="py-8 text-center">
                <FolderOpen className="h-6 w-6 text-text-muted mx-auto mb-2 opacity-40" />
                <p className="text-[11px] text-text-muted">
                  No collections yet
                </p>
              </div>
            ) : (
              filteredCollections.map((coll) => (
                <div
                  key={coll}
                  className={cn(
                    "group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-[13px]",
                    activeCollection === coll
                      ? "bg-brand/10 text-brand font-medium"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary",
                  )}
                  onClick={() => selectCollection(coll)}
                >
                  <Layers
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      activeCollection === coll
                        ? "text-brand"
                        : "text-text-muted",
                    )}
                  />
                  <span className="truncate flex-1">{coll}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        className="text-xs gap-2 text-destructive focus:text-destructive"
                        onClick={() =>
                          setDeleteConfirm({
                            type: "collection",
                            id: coll,
                            label: coll,
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Drop collection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-2 border-t border-border shrink-0 flex gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 shrink-0 p-0"
            onClick={refreshCollections}
            disabled={loadingCollections}
            title="Refresh list"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                loadingCollections && "animate-spin",
              )}
            />
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 gap-1.5 text-xs bg-brand text-white hover:bg-brand-hover border-0"
            onClick={() => setCreateCollOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            New collection
          </Button>
        </div>
      </aside>

      {/* Main: documents */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {activeCollection ? (
          <>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background shrink-0 gap-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand" />
                <span className="text-[13.5px] font-medium text-text-primary">
                  {activeCollection}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {total.toLocaleString()} docs
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger render={<span />}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => loadDocs(activeCollection)}
                      disabled={loadingDocs}
                    >
                      <RefreshCw
                        className={cn(
                          "h-3.5 w-3.5",
                          loadingDocs && "animate-spin",
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh documents</TooltipContent>
                </Tooltip>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-brand text-white hover:bg-brand-hover border-0"
                  onClick={() => setInsertDocOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Insert document
                </Button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <ScrollArea
                className={cn("flex-1 p-5", selectedDoc ? "pr-3" : "")}
              >
                {loadingDocs ? (
                  <div className="flex items-center justify-center h-48 gap-2 text-text-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading documents…</span>
                  </div>
                ) : docs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
                    <FileJson className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">No documents yet</p>
                    <p className="text-xs">Insert a document to get started</p>
                    <Button
                      size="sm"
                      className="mt-1 gap-1.5 bg-brand text-white hover:bg-brand-hover border-0"
                      onClick={() => setInsertDocOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Insert document
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                    {docs.map((doc) => (
                      <DocumentCard
                        key={doc.id}
                        doc={doc}
                        isSelected={selectedDoc?.id === doc.id}
                        onSelect={() =>
                          setSelectedDoc(
                            selectedDoc?.id === doc.id ? null : doc,
                          )
                        }
                        onDelete={() =>
                          setDeleteConfirm({
                            type: "doc",
                            id: doc.id,
                            label: String(doc.id).slice(0, 24),
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>

              {selectedDoc && (
                <div className="w-[340px] shrink-0 overflow-hidden">
                  <DocumentDetailPanel
                    doc={selectedDoc}
                    onClose={() => setSelectedDoc(null)}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-border2">
              <Layers className="h-7 w-7 opacity-30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">
                No collection selected
              </p>
              <p className="text-xs mt-1">
                Create a collection or select one from the sidebar
              </p>
            </div>
            <Button
              size="sm"
              className="gap-1.5 bg-brand text-white hover:bg-brand-hover border-0"
              onClick={() => setCreateCollOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> New collection
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateCollectionDialog
        open={createCollOpen}
        onClose={() => setCreateCollOpen(false)}
        onCreated={handleCollectionCreated}
        projectId={projectId}
        mongoDatabase={mongoDatabase}
      />

      {activeCollection && (
        <InsertDocumentDialog
          open={insertDocOpen}
          onClose={() => setInsertDocOpen(false)}
          onInserted={(doc) => {
            setDocs((prev) => [doc, ...prev]);
            setTotal((t) => t + 1);
          }}
          projectId={projectId}
          mongoDatabase={mongoDatabase}
          collection={activeCollection}
        />
      )}

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              {deleteConfirm?.type === "collection"
                ? `Drop collection "${deleteConfirm.label}" and all its documents? This cannot be undone.`
                : `Delete document ${deleteConfirm?.label}? This cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (!deleteConfirm) return;
                if (deleteConfirm.type === "collection")
                  handleDeleteCollection(deleteConfirm.id);
                else {
                  handleDeleteDoc(deleteConfirm.id);
                  setDeleteConfirm(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── KV Tab ───────────────────────────────────────────────────────────────────

function KVTab({
  projectId,
  mongoDatabase,
  initialKeys,
}: {
  projectId: string;
  mongoDatabase: string;
  initialKeys: KVEntry[];
}) {
  const [entries, setEntries] = React.useState<KVEntry[]>(initialKeys);
  const [search, setSearch] = React.useState("");
  const [setKVOpen, setSetKVOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState<string | null>(null);

  const filtered = entries.filter(
    (e) => !search || e.key.toLowerCase().includes(search.toLowerCase()),
  );

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/nosql/kv?mongo_database=${encodeURIComponent(mongoDatabase)}`,
      );
      const json = await res.json();
      setEntries(json.data?.entries ?? []);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (key: string) => {
    try {
      await fetch(
        `/api/nosql-proxy/projects/${projectId}/nosql/kv/${encodeURIComponent(key)}?mongo_database=${encodeURIComponent(mongoDatabase)}`,
        { method: "DELETE" },
      );
      setEntries((prev) => prev.filter((e) => e.key !== key));
    } catch {}
    setDeleteConfirm(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background shrink-0 gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by key…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-9 pr-3 text-xs rounded-lg border border-border bg-background text-text-primary placeholder:text-text-muted outline-none focus:border-brand transition-colors w-56"
            />
          </div>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {filtered.length} keys
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5", loading && "animate-spin")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs bg-brand text-white hover:bg-brand-hover border-0"
            onClick={() => setSetKVOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" /> Set key
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-0 bg-surface border-b border-border px-4 py-2">
        {["", "Key", "Value", "Actions"].map((h, i) => (
          <span
            key={i}
            className="text-[11px] font-semibold uppercase tracking-wider text-text-muted"
          >
            {h}
          </span>
        ))}
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
            <Key className="h-8 w-8 opacity-20" />
            <p className="text-sm font-medium">
              {search ? "No keys match your filter" : "No keys yet"}
            </p>
            {!search && (
              <Button
                size="sm"
                className="gap-1.5 bg-brand text-white hover:bg-brand-hover border-0"
                onClick={() => setSetKVOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Set first key
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((entry) => (
              <KVRow
                key={entry.key}
                entry={entry}
                onDelete={() => setDeleteConfirm(entry.key)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <SetKVDialog
        open={setKVOpen}
        onClose={() => setSetKVOpen(false)}
        onSet={(entry) =>
          setEntries((prev) => {
            const idx = prev.findIndex((e) => e.key === entry.key);
            if (idx >= 0) {
              const n = [...prev];
              n[idx] = entry;
              return n;
            }
            return [entry, ...prev];
          })
        }
        projectId={projectId}
        mongoDatabase={mongoDatabase}
      />

      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete key?</DialogTitle>
            <DialogDescription>
              Delete <code className="text-brand">{deleteConfirm}</code>? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page Client ─────────────────────────────────────────────────────────

export function NoSQLPageClient({
  userId,
  projectId,
  mongoDatabase,
  initialTab,
  initialCollection,
  collections,
  kvKeys,
  initialDocs,
  initialTotal,
}: NoSQLPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = React.useState(
    initialTab === "kv" ? "kv" : "collections",
  );

  const switchTab = (t: string) => {
    setTab(t);
    router.replace(`${pathname}?tab=${t}`, { scroll: false });
  };

  const TABS = [
    {
      id: "collections",
      label: "Collections",
      icon: Layers,
      count: collections.length,
    },
    { id: "kv", label: "Key-Value Store", icon: Key, count: kvKeys.length },
  ];

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-background px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-500/10">
              <Layers className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-medium text-text-primary">
                NoSQL Database
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                MongoDB documents and key-value store
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-[11px] font-mono text-text-muted bg-surface border border-border px-2.5 py-1.5 rounded-lg">
              {mongoDatabase || "—"}
            </code>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-background px-6 shrink-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-4 pb-3 pt-2 text-[13.5px] font-medium border-b-2 transition-colors whitespace-nowrap",
                  tab === t.id
                    ? "border-brand text-brand"
                    : "border-transparent text-text-muted hover:text-text-primary",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                <Badge
                  variant={tab === t.id ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] h-4 px-1.5",
                    tab === t.id ? "bg-brand text-white" : "",
                  )}
                >
                  {t.count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {tab === "collections" && (
            <CollectionsTab
              projectId={projectId}
              mongoDatabase={mongoDatabase}
              collections={collections}
              initialDocs={initialDocs}
              initialTotal={initialTotal}
              initialCollection={
                initialCollection ?? collections[0] ?? undefined
              }
            />
          )}
          {tab === "kv" && (
            <KVTab
              projectId={projectId}
              mongoDatabase={mongoDatabase}
              initialKeys={kvKeys}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
