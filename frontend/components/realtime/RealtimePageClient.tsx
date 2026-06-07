"use client";
// frontend/components/realtime/RealtimePageClient.tsx

import * as React from "react";
import {
  Radio,
  Plus,
  RefreshCw,
  Copy,
  Shield,
  Globe,
  Trash2,
  MoreHorizontal,
  Code2,
  Wifi,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  Database,
  Link2,
  Pencil,
  Check,
  AlertTriangle,
  Search,
  ToggleLeft,
  Hash,
  Type,
  Braces,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RealtimeChannel, RealtimeStats } from "@/lib/api/realtime-client";
import type { RtdbTree } from "@/lib/api/realtime-data-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RealtimePageClientProps {
  projectId: string;
  mongoDatabase: string;
  initialChannels: RealtimeChannel[];
  initialStats: RealtimeStats;
  initialRules: string;
  initialTree: RtdbTree;
  dbUrl: string;
}

type ValueType = "auto" | "string" | "number" | "boolean" | "object";

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
  parentPath: string;
  onSaved: () => void;
  projectId: string;
  mongoDatabase: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isLeaf(
  node: unknown,
): node is { __value__: unknown; __type__: string } {
  return typeof node === "object" && node !== null && "__value__" in node;
}

function getTypeIcon(type: string, value: unknown) {
  if (type === "boolean" || typeof value === "boolean")
    return <ToggleLeft className="h-3.5 w-3.5 text-emerald-500" />;
  if (type === "number" || typeof value === "number")
    return <Hash className="h-3.5 w-3.5 text-blue-500" />;
  if (type === "object" || typeof value === "object")
    return <Braces className="h-3.5 w-3.5 text-violet-500" />;
  return <Type className="h-3.5 w-3.5 text-text-muted" />;
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function countNodes(tree: RtdbTree): number {
  let count = 0;
  for (const v of Object.values(tree)) {
    count++;
    if (!isLeaf(v)) count += countNodes(v as RtdbTree);
  }
  return count;
}

// ─── Add Node Dialog ──────────────────────────────────────────────────────────

function AddNodeDialog({
  open,
  onClose,
  parentPath,
  onSaved,
  projectId,
  mongoDatabase,
}: AddNodeDialogProps) {
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState("");
  const [type, setType] = React.useState<ValueType>("auto");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setKey("");
      setValue("");
      setType("auto");
      setError(null);
    }
  }, [open]);

  const handleSave = async () => {
    if (!key.trim()) {
      setError("Key is required");
      return;
    }
    setLoading(true);
    setError(null);
    const path =
      parentPath === "/" ? `/${key.trim()}` : `${parentPath}/${key.trim()}`;
    try {
      const params = new URLSearchParams({
        projectId,
        mongo_database: mongoDatabase,
      });
      const res = await fetch(`/api/internal/realtime/data?${params}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, value: value || null, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.detail ?? data?.error ?? "Failed");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const TYPE_OPTS: {
    value: ValueType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: "auto",
      label: "Auto",
      icon: <span className="text-text-muted text-xs">*</span>,
    },
    {
      value: "boolean",
      label: "Boolean",
      icon: <ToggleLeft className="h-3.5 w-3.5 text-emerald-500" />,
    },
    {
      value: "number",
      label: "Number",
      icon: <Hash className="h-3.5 w-3.5 text-blue-500" />,
    },
    {
      value: "object",
      label: "Object",
      icon: <Braces className="h-3.5 w-3.5 text-violet-500" />,
    },
    {
      value: "string",
      label: "String",
      icon: <Type className="h-3.5 w-3.5 text-text-muted" />,
    },
  ];

  const fullPath =
    parentPath === "/" ? `/${key || "key"}` : `${parentPath}/${key || "key"}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Add node</DialogTitle>
          <DialogDescription className="text-xs">
            Adding to{" "}
            <code className="font-mono bg-surface px-1 rounded">
              {parentPath}
            </code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-danger-bg bg-danger-bg px-3 py-2 text-xs text-danger-text">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Key / Value / Type row — mimics Firebase UI */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-[11px] text-text-muted uppercase tracking-wide">
                Key
              </Label>
              <Input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="key"
                className="h-8 text-sm font-mono"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-text-muted uppercase tracking-wide">
                Value
              </Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  type === "boolean"
                    ? "true / false"
                    : type === "number"
                      ? "0"
                      : "value"
                }
                className="h-8 text-sm font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-text-muted uppercase tracking-wide">
                Type
              </Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as ValueType)}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTS.map((t) => (
                    <SelectItem
                      key={t.value}
                      value={t.value}
                      className="text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        {t.icon}
                        {t.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-[11px] text-text-muted font-mono truncate">
            Path: <span className="text-text-secondary">{fullPath}</span>
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading || !key.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white border-0 gap-1.5"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

interface TreeNodeProps {
  nodeKey: string;
  value: unknown;
  path: string;
  depth: number;
  projectId: string;
  mongoDatabase: string;
  onRefresh: () => void;
  isRoot?: boolean;
  dbUrl: string;
}

function TreeNode({
  nodeKey,
  value,
  path,
  depth,
  projectId,
  mongoDatabase,
  onRefresh,
  isRoot,
  dbUrl,
}: TreeNodeProps) {
  const [expanded, setExpanded] = React.useState(depth < 2);
  const [editing, setEditing] = React.useState(false);
  const [editVal, setEditVal] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const leaf = isLeaf(value);
  const hasChildren = !leaf && typeof value === "object" && value !== null;
  const children = hasChildren ? (value as RtdbTree) : {};
  const childCount = Object.keys(children).length;

  const displayPath = isRoot ? dbUrl : path;

  const startEdit = () => {
    setEditVal(leaf ? displayValue((value as any).__value__) : "");
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const params = new URLSearchParams({
        projectId,
        mongo_database: mongoDatabase,
      });
      await fetch(`/api/internal/realtime/data?${params}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, value: editVal, type: "auto" }),
      });
      setEditing(false);
      onRefresh();
    } catch {
      /* non-fatal */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${path}" and all its children?`)) return;
    setDeleting(true);
    try {
      const params = new URLSearchParams({
        projectId,
        mongo_database: mongoDatabase,
        path,
      });
      await fetch(`/api/internal/realtime/data?${params}`, {
        method: "DELETE",
      });
      onRefresh();
    } catch {
      /* non-fatal */
    } finally {
      setDeleting(false);
    }
  };

  const indentStyle = { paddingLeft: `${depth * 20 + 12}px` };

  return (
    <div className="group/node">
      {/* Node row */}
      <div
        className={cn(
          "flex items-center gap-0 min-h-[36px] border-b border-border/40 hover:bg-surface transition-colors cursor-pointer select-none",
          isRoot && "bg-surface/50",
        )}
        style={indentStyle}
        onClick={() => hasChildren && setExpanded((e) => !e)}
      >
        {/* Expand toggle */}
        <span className="w-5 shrink-0 flex items-center justify-center">
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
            )
          ) : null}
        </span>

        {/* Key */}
        <span
          className={cn(
            "font-mono text-[13px] shrink-0 mr-2",
            isRoot ? "text-text-primary font-semibold" : "text-info-text",
          )}
        >
          {isRoot ? displayPath : nodeKey}
        </span>

        {isRoot && (
          <span className="flex items-center gap-1 text-[11px] text-text-muted mr-2">
            <Link2 className="h-3 w-3" />
          </span>
        )}

        {/* Colon separator */}
        {!isRoot && leaf && (
          <span className="text-text-muted text-[13px] mr-2">:</span>
        )}

        {/* Value (leaf) or child count */}
        {leaf ? (
          editing ? (
            <div
              className="flex items-center gap-2 flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="h-6 text-xs font-mono py-0 flex-1 min-w-0 max-w-[200px]"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-blue-600 hover:text-blue-700 p-0.5"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-text-muted hover:text-danger p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <span
              className="text-[13px] font-mono text-text-secondary truncate max-w-[300px] cursor-text hover:text-text-primary transition-colors"
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEdit();
              }}
              title="Double-click to edit"
            >
              {displayValue((value as any).__value__)}
            </span>
          )
        ) : (
          <span className="text-[11px] text-text-muted">
            {!expanded && childCount > 0
              ? `{${childCount} ${childCount === 1 ? "child" : "children"}}`
              : ""}
          </span>
        )}

        {/* Actions (shown on hover) */}
        {!isRoot && (
          <div
            className="ml-auto opacity-0 group-hover/node:opacity-100 transition-opacity flex items-center gap-1 pr-3"
            onClick={(e) => e.stopPropagation()}
          >
            {leaf && (
              <button
                onClick={startEdit}
                className="p-1 rounded hover:bg-border text-text-muted hover:text-text-primary transition-colors"
                title="Edit value"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={() => setAddOpen(true)}
              className="p-1 rounded hover:bg-border text-text-muted hover:text-text-primary transition-colors"
              title="Add child"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 rounded hover:bg-danger-bg text-text-muted hover:text-danger-text transition-colors"
              title="Delete"
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </button>
          </div>
        )}

        {isRoot && (
          <div
            className="ml-auto pr-3 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1 px-2 h-6 rounded border border-border text-[11px] text-text-secondary hover:bg-surface hover:text-text-primary transition-colors"
            >
              <Plus className="h-3 w-3" /> Add
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(displayPath)}
              className="p-1 rounded hover:bg-border text-text-muted transition-colors"
              title="Copy URL"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {Object.entries(children).map(([k, v]) => (
            <TreeNode
              key={k}
              nodeKey={k}
              value={v}
              path={`${path}/${k}`}
              depth={depth + 1}
              projectId={projectId}
              mongoDatabase={mongoDatabase}
              onRefresh={onRefresh}
              dbUrl={dbUrl}
            />
          ))}
          {/* Add child button inside expanded node */}
          <div
            className="flex items-center gap-2 min-h-[32px] border-b border-border/30 hover:bg-surface/50 cursor-pointer group/add"
            style={{ paddingLeft: `${(depth + 1) * 20 + 12}px` }}
            onClick={(e) => {
              e.stopPropagation();
              setAddOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 text-blue-500 opacity-0 group-hover/add:opacity-100 transition-opacity" />
            <span className="text-[12px] text-blue-500 opacity-0 group-hover/add:opacity-100 transition-opacity">
              Add child
            </span>
          </div>
        </div>
      )}

      {/* Add node dialog */}
      <AddNodeDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        parentPath={path}
        onSaved={onRefresh}
        projectId={projectId}
        mongoDatabase={mongoDatabase}
      />
    </div>
  );
}

// ─── Data Tab ──────────────────────────────────────────────────────────────────

function DataTab({
  projectId,
  mongoDatabase,
  initialTree,
  dbUrl,
}: {
  projectId: string;
  mongoDatabase: string;
  initialTree: RtdbTree;
  dbUrl: string;
}) {
  const [tree, setTree] = React.useState<RtdbTree>(initialTree);
  const [loading, setLoading] = React.useState(false);
  const [addRootOpen, setAddRootOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        projectId,
        mongo_database: mongoDatabase,
        path: "/",
      });
      const res = await fetch(`/api/internal/realtime/data?${params}`);
      const data = await res.json();
      setTree(data?.data?.tree ?? {});
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, [projectId, mongoDatabase]);

  const nodeCount = countNodes(tree);
  const isEmpty = Object.keys(tree).length === 0;

  // Filter tree by search (simple key filter on top-level for now)
  const filteredTree = search
    ? Object.fromEntries(
        Object.entries(tree).filter(([k]) =>
          k.toLowerCase().includes(search.toLowerCase()),
        ),
      )
    : tree;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* URL bar — Firebase style */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface">
        <Link2 className="h-3.5 w-3.5 text-text-muted shrink-0" />
        <span className="text-[12px] font-mono text-text-secondary flex-1 truncate select-all">
          {dbUrl}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(dbUrl)}
          className="p-1 rounded hover:bg-border text-text-muted transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <div className="w-px h-4 bg-border" />
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1 rounded hover:bg-border text-text-muted transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Search + add bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
          <Input
            placeholder="Search keys..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <span className="text-xs text-text-muted">
          {nodeCount} node{nodeCount !== 1 ? "s" : ""}
        </span>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0 ml-auto"
          onClick={() => setAddRootOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" /> Add node
        </Button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 gap-2 text-text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface border border-border">
              <Database className="h-6 w-6 text-text-muted" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">
                No data yet
              </p>
              <p className="text-xs text-text-muted mt-1">
                Click "Add node" to start adding data to your realtime database.
              </p>
            </div>
            <Button
              size="sm"
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-0"
              onClick={() => setAddRootOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Add first node
            </Button>
          </div>
        ) : (
          <div className="font-mono">
            {/* Root row — mimics Firebase DB URL row */}
            <TreeNode
              key="__root__"
              nodeKey="root"
              value={filteredTree}
              path="/"
              depth={0}
              projectId={projectId}
              mongoDatabase={mongoDatabase}
              onRefresh={refresh}
              isRoot
              dbUrl={dbUrl}
            />
          </div>
        )}
      </div>

      {/* Add root node dialog */}
      <AddNodeDialog
        open={addRootOpen}
        onClose={() => setAddRootOpen(false)}
        parentPath="/"
        onSaved={refresh}
        projectId={projectId}
        mongoDatabase={mongoDatabase}
      />
    </div>
  );
}

// ─── Channels Tab ─────────────────────────────────────────────────────────────

function CreateChannelDialog({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated: (ch: RealtimeChannel) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [name, setName] = React.useState("");
  const [path, setPath] = React.useState("/");
  const [rule, setRule] = React.useState("auth != null");
  const [presence, setPresence] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/internal/realtime/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: name.trim(),
          path: path.trim(),
          access_rule: rule,
          enable_presence: presence,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.detail ?? data?.error ?? "Failed");
        return;
      }
      onCreated({
        id: data.data?.id ?? "",
        name: name.trim(),
        path,
        access_rule: rule,
        is_active: true,
        enable_presence: presence,
        created_at: new Date().toISOString(),
      });
      setOpen(false);
      setName("");
      setPath("/");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        className="h-8 gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" /> New Channel
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create channel</DialogTitle>
          <DialogDescription className="text-xs">
            Subscribe clients to live database changes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <Alert className="border-red-200 bg-danger-bg">
              <AlertTriangle className="h-4 w-4 text-danger-text" />
              <AlertDescription className="text-[12.5px] text-danger-text">
                {error}
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Channel name</Label>
            <Input
              placeholder="e.g. notifications"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-sm font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Database path</Label>
            <Input
              placeholder="/notifications"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="h-9 text-sm font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Access rule</Label>
            <Input
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              className="h-9 text-sm font-mono"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
            <div>
              <p className="text-[13px] font-medium text-text-primary">
                Presence tracking
              </p>
              <p className="text-[11px] text-text-muted">
                Track connected clients
              </p>
            </div>
            <Switch checked={presence} onCheckedChange={setPresence} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-brand hover:bg-brand-hover text-white border-0"
            onClick={handleCreate}
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Create channel"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChannelsTab({
  projectId,
  channels,
  stats,
  onChannelsChange,
}: {
  projectId: string;
  channels: RealtimeChannel[];
  stats: RealtimeStats;
  onChannelsChange: (c: RealtimeChannel[]) => void;
}) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this channel?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(
        `/api/internal/realtime/channels/${id}?projectId=${projectId}`,
        { method: "DELETE" },
      );
      if (res.ok) onChannelsChange(channels.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-medium text-text-primary">Channels</h2>
          <p className="text-sm text-text-secondary mt-1">
            Define which paths clients can subscribe to and receive live updates
            from.
          </p>
        </div>
        <CreateChannelDialog
          projectId={projectId}
          onCreated={(ch) => onChannelsChange([ch, ...channels])}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Active",
            value: stats.active_channels,
            color: "text-danger-text",
            bg: "bg-danger-bg",
            icon: Radio,
          },
          {
            label: "Clients",
            value: stats.connected_clients,
            color: "text-success-text",
            bg: "bg-success-bg",
            icon: Wifi,
          },
          {
            label: "Presence",
            value: stats.presence_channels,
            color: "text-info-text",
            bg: "bg-info-bg",
            icon: Shield,
          },
          {
            label: "Total",
            value: stats.total_channels,
            color: "text-warn-text",
            bg: "bg-warn-bg",
            icon: Globe,
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-background p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg",
                    s.bg,
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", s.color)} />
                </div>
                <span className="text-xs text-text-secondary">{s.label}</span>
              </div>
              <p className="text-xl font-medium text-text-primary">{s.value}</p>
            </div>
          );
        })}
      </div>

      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border2 bg-surface py-16">
          <Radio className="h-8 w-8 text-text-muted" />
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">
              No channels yet
            </p>
            <p className="text-xs text-text-muted mt-1">
              Create a channel to start broadcasting realtime events.
            </p>
          </div>
          <CreateChannelDialog
            projectId={projectId}
            onCreated={(ch) => onChannelsChange([ch, ...channels])}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface hover:bg-surface border-b border-border">
                {[
                  "Channel",
                  "Path",
                  "Access rule",
                  "Presence",
                  "Status",
                  "",
                ].map((h) => (
                  <TableHead
                    key={h}
                    className="text-[11px] font-semibold uppercase tracking-wider text-text-muted"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((ch) => (
                <TableRow
                  key={ch.id}
                  className="group border-b border-border hover:bg-surface"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          ch.is_active ? "bg-success" : "bg-text-muted",
                        )}
                      />
                      <span className="text-[13px] font-medium">{ch.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-[12px] font-mono text-text-secondary bg-surface border border-border px-2 py-0.5 rounded">
                      {ch.path}
                    </code>
                  </TableCell>
                  <TableCell>
                    <code className="text-[11px] font-mono text-info-text">
                      {ch.access_rule}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-4 px-1.5",
                        ch.enable_presence
                          ? "text-success-text border-success-bg"
                          : "",
                      )}
                    >
                      {ch.enable_presence ? "On" : "Off"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        ch.is_active
                          ? "bg-success-bg text-success-text"
                          : "bg-surface text-text-muted",
                      )}
                    >
                      {ch.is_active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                      )}
                      {ch.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          disabled={deletingId === ch.id}
                        >
                          {deletingId === ch.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          className="text-xs gap-2"
                          onClick={() => navigator.clipboard.writeText(ch.path)}
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy path
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs gap-2 text-danger"
                          onClick={() => handleDelete(ch.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Rules Tab ────────────────────────────────────────────────────────────────

function RulesTab({
  projectId,
  initialRules,
}: {
  projectId: string;
  initialRules: string;
}) {
  const [rules, setRules] = React.useState(initialRules);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      JSON.parse(rules);
    } catch {
      setError("Invalid JSON — fix syntax before saving.");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch("/api/internal/realtime/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, rules_json: rules }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.detail ?? "Failed");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-medium text-text-primary">
            Security Rules
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Define who can read and write to your realtime database.
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5 bg-brand hover:bg-brand-hover text-white border-0"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saved ? "Saved!" : "Publish rules"}
        </Button>
      </div>
      {error && (
        <Alert className="border-red-200 bg-danger-bg">
          <AlertTriangle className="h-4 w-4 text-danger-text" />
          <AlertDescription className="text-[12.5px] text-danger-text">
            {error}
          </AlertDescription>
        </Alert>
      )}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-text-secondary" />
            <span className="text-[13px] font-medium text-text-primary">
              rules.json
            </span>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              JSON
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => navigator.clipboard.writeText(rules)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
        <textarea
          className="w-full font-mono text-[12.5px] bg-background text-text-primary p-4 outline-none resize-none leading-relaxed h-80"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RealtimePageClient({
  projectId,
  mongoDatabase,
  initialChannels,
  initialStats,
  initialRules,
  initialTree,
  dbUrl,
}: RealtimePageClientProps) {
  const [channels, setChannels] =
    React.useState<RealtimeChannel[]>(initialChannels);
  const [stats] = React.useState<RealtimeStats>(initialStats);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-bg3">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-danger-bg">
            <Radio className="h-4 w-4 text-danger-text" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-text-primary">
              Realtime Database
            </h1>
            <p className="text-xs text-text-secondary">
              Live data sync & channels
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-success-bg text-success-text">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Connected
          </span>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
            <Code2 className="h-3.5 w-3.5" />
            SDK
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="data"
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="border-b border-border bg-background px-6">
          <TabsList className="h-10 bg-transparent p-0 gap-0 rounded-none">
            {[
              { value: "data", label: "Data" },
              { value: "rules", label: "Rules" },
              { value: "channels", label: "Channels" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent px-4 py-2 text-[13px] text-text-secondary data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-blue-600 data-[state=active]:font-medium transition-colors"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="data" className="flex-1 overflow-hidden m-0">
          <DataTab
            projectId={projectId}
            mongoDatabase={mongoDatabase}
            initialTree={initialTree}
            dbUrl={dbUrl}
          />
        </TabsContent>

        <TabsContent value="rules" className="flex-1 overflow-auto m-0">
          <RulesTab projectId={projectId} initialRules={initialRules} />
        </TabsContent>

        <TabsContent value="channels" className="flex-1 overflow-auto m-0">
          <ChannelsTab
            projectId={projectId}
            channels={channels}
            stats={stats}
            onChannelsChange={setChannels}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
