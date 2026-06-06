// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/realtime/page.tsx
"use client";

import * as React from "react";
import {
  Radio,
  Plus,
  RefreshCw,
  Copy,
  ChevronRight,
  ChevronDown,
  Shield,
  Globe,
  Trash2,
  MoreHorizontal,
  Code2,
  Wifi,
  ArrowUpRight,
  Pencil,
  AlertTriangle,
  Search,
  Eye,
  Save,
  X,
  FileJson,
  Hash,
  ToggleLeft,
  Type,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ─── Mock data ────────────────────────────────────────────────────────────────

const DB_URL = "https://ajo-app-929ee-default-rtdb.yourbaas.io";

type DbValue = string | number | boolean | null | Record<string, DbValue>;

const MOCK_DATA: Record<string, DbValue> = {
  users: {
    uid_001: { name: "Adaeze Okafor", status: "online", lastSeen: 1749167200 },
    uid_002: { name: "Emeka Nwosu", status: "offline", lastSeen: 1749080800 },
    uid_003: { name: "Chioma Eze", status: "online", lastSeen: 1749167100 },
  },
  messages: {
    room_general: {
      msg_001: { text: "Hello world", uid: "uid_001", ts: 1749167000 },
      msg_002: { text: "Welcome to YourBaaS!", uid: "uid_003", ts: 1749167050 },
    },
    room_dev: {
      msg_003: { text: "Realtime works 🔥", uid: "uid_002", ts: 1749080900 },
    },
  },
  presence: {
    uid_001: true,
    uid_003: true,
  },
  config: {
    version: "2.1.0",
    maintenance: false,
    featureFlags: {
      newUI: true,
      betaSearch: false,
    },
  },
};

const CHANNELS = [
  {
    id: "ch_1",
    name: "users",
    path: "/users",
    connected: 12,
    rules: "auth != null",
    active: true,
  },
  {
    id: "ch_2",
    name: "messages",
    path: "/messages",
    connected: 8,
    rules: "auth != null",
    active: true,
  },
  {
    id: "ch_3",
    name: "presence",
    path: "/presence",
    connected: 12,
    rules: "auth != null",
    active: true,
  },
  {
    id: "ch_4",
    name: "config",
    path: "/config",
    connected: 1,
    rules: "auth.role == 'admin'",
    active: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getValueType(
  value: unknown,
): "object" | "string" | "number" | "boolean" | "null" {
  if (value === null) return "null";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "null";
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  object: FileJson,
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  null: X,
};

const TYPE_COLORS: Record<string, string> = {
  string: "text-[--warn-text]",
  number: "text-[#7F77DD]",
  boolean: "text-[--info-text]",
  null: "text-[--danger-text]",
  object: "text-[--brand]",
};

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return `"${value}"`;
  return String(value);
}

// ─── Selected node panel ──────────────────────────────────────────────────────

interface SelectedNode {
  keyName: string;
  value: DbValue;
  path: string;
}

function NodeDetailPanel({
  node,
  onClose,
}: {
  node: SelectedNode;
  onClose: () => void;
}) {
  const isObject = node.value !== null && typeof node.value === "object";
  const type = getValueType(node.value);
  const TypeIcon = TYPE_ICONS[type];
  const entries = isObject
    ? Object.entries(node.value as Record<string, DbValue>)
    : [];

  return (
    <div className="flex flex-col h-full bg-[--background] border-l border-[--border]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[--border] bg-[--surface] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[--brand]/10">
            <TypeIcon className="h-3.5 w-3.5 text-[--brand]" />
          </div>
          <span className="text-[13px] font-medium text-[--text-primary] truncate">
            {node.keyName}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] h-4 px-1.5 shrink-0 font-mono"
          >
            {type}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Path */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[--border] bg-[--surface]">
        <Link2 className="h-3 w-3 text-[--text-muted] shrink-0" />
        <span className="text-[11px] font-mono text-[--text-muted] truncate">
          {node.path}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 ml-auto"
          onClick={() =>
            navigator.clipboard.writeText(`${DB_URL}${node.path}.json`)
          }
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isObject ? (
          <div className="px-4 py-4 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted] mb-3">
              Fields — {entries.length}
            </p>
            {entries.map(([k, v]) => {
              const fieldType = getValueType(v);
              const FieldIcon = TYPE_ICONS[fieldType];
              const isNested = fieldType === "object";
              return (
                <div
                  key={k}
                  className="group flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-[--surface] transition-colors"
                >
                  <FieldIcon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      TYPE_COLORS[fieldType],
                    )}
                  />
                  <span className="text-[12px] font-medium text-[--text-secondary] shrink-0">
                    {k}
                  </span>
                  <span className="text-[12px] font-mono text-[--text-muted] truncate flex-1">
                    {isNested
                      ? `{${Object.keys(v as Record<string, DbValue>).length} fields}`
                      : formatValue(v)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!isNested && (
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-[--danger]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <button className="mt-2 flex w-full items-center gap-2 rounded-lg border border-dashed border-[--border2] px-3 py-2 text-[12px] text-[--text-muted] hover:border-[--brand] hover:text-[--brand] transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add field
            </button>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted] mb-2">
                Value
              </p>
              <div className="rounded-lg border border-[--border] bg-[--surface] p-3">
                <span
                  className={cn("text-[13px] font-mono", TYPE_COLORS[type])}
                >
                  {formatValue(node.value)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-8 gap-1.5 text-xs flex-1 bg-[--brand] hover:bg-[--brand-hover] text-white border-0"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit value
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-[--danger] border-[--danger]/30 hover:bg-[--danger-bg]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* SDK snippet */}
      <div className="border-t border-[--border] px-4 py-3 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[--text-muted] mb-2">
          SDK snippet
        </p>
        <div className="rounded-lg bg-[--surface] border border-[--border] p-2.5 font-mono text-[11px] text-[--text-secondary] leading-relaxed">
          <span className="text-[--brand]">await</span> baas.realtime
          <br />
          &nbsp;&nbsp;.on(
          <span className="text-[--warn-text]">"{node.path}"</span>,<br />
          &nbsp;&nbsp;&nbsp;&nbsp;(event) ={">"} {"{"}...{"}"})
        </div>
      </div>
    </div>
  );
}

// ─── JSON Tree ────────────────────────────────────────────────────────────────

function JsonNode({
  keyName,
  value,
  depth = 0,
  path = "",
  onSelect,
  selectedPath,
}: {
  keyName: string;
  value: DbValue;
  depth?: number;
  path?: string;
  onSelect: (node: SelectedNode) => void;
  selectedPath: string;
}) {
  const [open, setOpen] = React.useState(depth < 1);
  const isObject = value !== null && typeof value === "object";
  const entries = isObject
    ? Object.entries(value as Record<string, DbValue>)
    : [];
  const currentPath = `${path}/${keyName}`;
  const isSelected = selectedPath === currentPath;

  if (!isObject) {
    const type = getValueType(value);
    const TypeIcon = TYPE_ICONS[type];

    return (
      <button
        className={cn(
          "group w-full flex items-center gap-2 py-[3px] pr-3 rounded-md transition-colors text-left",
          isSelected ? "bg-[--brand]/10" : "hover:bg-[--surface]",
        )}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => onSelect({ keyName, value, path: currentPath })}
      >
        <TypeIcon className={cn("h-3 w-3 shrink-0", TYPE_COLORS[type])} />
        <span className="text-[12px] font-medium text-[--text-secondary] shrink-0">
          {keyName}:
        </span>
        <span
          className={cn(
            "text-[12px] font-mono truncate flex-1",
            TYPE_COLORS[type],
          )}
        >
          {formatValue(value)}
        </span>
      </button>
    );
  }

  return (
    <div>
      <button
        className={cn(
          "group w-full flex items-center gap-1.5 py-[3px] pr-3 rounded-md transition-colors text-left",
          isSelected ? "bg-[--brand]/10" : "hover:bg-[--surface]",
        )}
        style={{ paddingLeft: depth * 16 + 4 }}
        onClick={() => {
          setOpen((o) => !o);
          onSelect({ keyName, value, path: currentPath });
        }}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[--text-muted]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[--text-muted]" />
        )}
        <span className="text-[12.5px] font-semibold text-[--text-primary]">
          {keyName}
        </span>
        {!open && (
          <span className="text-[11px] text-[--text-muted] font-mono">{`{${entries.length}}`}</span>
        )}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-[--brand]/10 text-[--text-muted] hover:text-[--brand]"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Plus className="h-3 w-3" />
          </div>
          <div
            className="h-5 w-5 flex items-center justify-center rounded hover:bg-[--danger-bg] text-[--text-muted] hover:text-[--danger]"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </div>
        </div>
      </button>
      {open && (
        <div
          className="border-l border-[--border] ml-[17px]"
          style={{ marginLeft: depth * 16 + 17 }}
        >
          {entries.map(([k, v]) => (
            <JsonNode
              key={k}
              keyName={k}
              value={v as DbValue}
              depth={depth + 1}
              path={currentPath}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Connection badge ─────────────────────────────────────────────────────────

function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        connected
          ? "bg-[--success-bg] text-[--success-text]"
          : "bg-[--danger-bg] text-[--danger-text]",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          connected ? "bg-[--success] animate-pulse" : "bg-[--danger]",
        )}
      />
      {connected ? "Connected" : "Disconnected"}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--background] p-4 hover:border-[--border2] transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[8px]",
            iconBg,
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", iconColor)} />
        </div>
        <span className="text-xs text-[--text-secondary]">{label}</span>
      </div>
      <p className="text-2xl font-medium text-[--text-primary] leading-none">
        {value}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RealtimePage() {
  const [connected] = React.useState(true);
  const [selectedNode, setSelectedNode] = React.useState<SelectedNode | null>(
    null,
  );
  const [selectedPath, setSelectedPath] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [newChannelOpen, setNewChannelOpen] = React.useState(false);

  const handleSelectNode = (node: SelectedNode) => {
    setSelectedNode(node);
    setSelectedPath(node.path);
  };

  const handleClosePanel = () => {
    setSelectedNode(null);
    setSelectedPath("");
  };

  const filteredChannels = CHANNELS.filter(
    (ch) => !search || ch.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[--bg3]">
        {/* ── Page Header ── */}
        <div className="flex items-center justify-between border-b border-[--border] bg-[--background] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[--danger-bg]">
              <Radio className="h-4.5 w-4.5 text-[--danger-text]" />
            </div>
            <div>
              <h1 className="text-base font-medium text-[--text-primary]">
                Realtime Database
              </h1>
              <p className="text-sm text-[--text-secondary] mt-0.5">
                Browse and edit live data, manage channels and security rules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ConnectionBadge connected={connected} />
            <div className="w-px h-5 bg-[--border]" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Code2 className="h-3.5 w-3.5" />
              SDK Setup
            </Button>
            <Dialog open={newChannelOpen} onOpenChange={setNewChannelOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-[--brand] hover:bg-[--brand-hover] text-white border-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Channel
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create channel</DialogTitle>
                  <DialogDescription>
                    Subscribe clients to a database path. Changes at this path
                    and below will be broadcast in realtime.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Channel name</Label>
                    <Input
                      placeholder="e.g. notifications"
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Database path</Label>
                    <Input
                      placeholder="/notifications"
                      className="h-9 text-sm font-mono"
                    />
                    <p className="text-[11px] text-[--text-muted]">
                      Clients subscribed to this channel receive updates for
                      this path and all children.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Access rule</Label>
                    <Input
                      placeholder="auth != null"
                      className="h-9 text-sm font-mono"
                      defaultValue="auth != null"
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[--border] bg-[--surface] p-3">
                    <div>
                      <p className="text-[13px] font-medium text-[--text-primary]">
                        Presence tracking
                      </p>
                      <p className="text-[11px] text-[--text-muted]">
                        Automatically track connected clients
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewChannelOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[--brand] hover:bg-[--brand-hover] text-white border-0"
                    onClick={() => setNewChannelOpen(false)}
                  >
                    Create channel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs
          defaultValue="data"
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="border-b border-[--border] bg-[--background] px-6">
            <TabsList className="h-11 bg-transparent p-0 gap-0 rounded-none">
              {[
                { value: "data", label: "Data Explorer" },
                { value: "channels", label: "Channels" },
                { value: "rules", label: "Security Rules" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-1 text-[13px] text-[--text-secondary] data-[state=active]:border-[--brand] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[--brand] data-[state=active]:font-medium transition-colors"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ─── DATA TAB ─── */}
          <TabsContent value="data" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              {/* Left: JSON tree */}
              <div
                className={cn(
                  "flex flex-col border-r border-[--border] bg-[--background] overflow-hidden shrink-0 transition-all duration-200",
                  selectedNode ? "w-[340px]" : "flex-1",
                )}
              >
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[--border] bg-[--surface] shrink-0">
                  <div className="flex items-center gap-1.5 flex-1 rounded-lg border border-[--border] bg-[--background] px-2.5 py-1.5 overflow-hidden">
                    <Globe className="h-3 w-3 shrink-0 text-[--text-muted]" />
                    <span className="text-[11px] font-mono text-[--text-muted] truncate">
                      {DB_URL}/
                    </span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() =>
                          navigator.clipboard.writeText(`${DB_URL}/.json`)
                        }
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy REST URL</TooltipContent>
                  </Tooltip>
                </div>

                {/* Tree header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-[--border] bg-[--surface]/50 shrink-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted]">
                    / root
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-xs text-[--brand] hover:text-[--brand-hover] px-2"
                  >
                    <Plus className="h-3 w-3" />
                    Add node
                  </Button>
                </div>

                {/* Tree */}
                <ScrollArea className="flex-1 py-2 px-2">
                  {Object.entries(MOCK_DATA).map(([k, v]) => (
                    <JsonNode
                      key={k}
                      keyName={k}
                      value={v as DbValue}
                      depth={0}
                      path=""
                      onSelect={handleSelectNode}
                      selectedPath={selectedPath}
                    />
                  ))}
                </ScrollArea>
              </div>

              {/* Right: Node detail panel */}
              {selectedNode ? (
                <div className="flex-1 overflow-hidden">
                  <NodeDetailPanel
                    node={selectedNode}
                    onClose={handleClosePanel}
                  />
                </div>
              ) : (
                /* Empty state when nothing selected */
                <div className="hidden" />
              )}
            </div>
          </TabsContent>

          {/* ─── CHANNELS TAB ─── */}
          <TabsContent value="channels" className="flex-1 overflow-auto m-0">
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-medium text-[--text-primary]">
                    Channels
                  </h2>
                  <p className="text-sm text-[--text-secondary] mt-1">
                    Define which paths clients can subscribe to and receive live
                    updates from.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-[--brand] hover:bg-[--brand-hover] text-white border-0"
                  onClick={() => setNewChannelOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  New channel
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  icon={Radio}
                  label="Active channels"
                  value="4"
                  iconColor="text-[--danger-text]"
                  iconBg="bg-[--danger-bg]"
                />
                <StatCard
                  icon={Wifi}
                  label="Connected clients"
                  value="33"
                  iconColor="text-[--success-text]"
                  iconBg="bg-[--success-bg]"
                />
                <StatCard
                  icon={Shield}
                  label="Secured channels"
                  value="4"
                  iconColor="text-[--info-text]"
                  iconBg="bg-[--info-bg]"
                />
                <StatCard
                  icon={Globe}
                  label="Regions"
                  value="1"
                  iconColor="text-[--warn-text]"
                  iconBg="bg-[--warn-bg]"
                />
              </div>

              {/* Table */}
              <div className="rounded-xl border border-[--border] bg-[--background] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[--border] bg-[--surface]">
                  <span className="text-xs text-[--text-muted]">
                    {CHANNELS.length} channels
                  </span>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[--text-muted] pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-7 pl-7 pr-3 text-xs rounded-lg border border-[--border] bg-[--background] text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--brand] transition-colors w-36"
                    />
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[--surface] hover:bg-[--surface] border-b border-[--border]">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted]">
                        Channel
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted]">
                        Path
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted]">
                        Connected
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted] hidden md:table-cell">
                        Access rule
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted]">
                        Status
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChannels.map((ch) => (
                      <TableRow
                        key={ch.id}
                        className="group border-b border-[--border] hover:bg-[--surface] transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[--success] shrink-0" />
                            <span className="text-[13px] font-medium text-[--text-primary]">
                              {ch.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-[12px] font-mono text-[--text-secondary] bg-[--surface] border border-[--border] px-2 py-0.5 rounded-[5px]">
                            {ch.path}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Wifi className="h-3.5 w-3.5 text-[--success-text]" />
                            <span className="text-[13px] tabular-nums text-[--text-primary]">
                              {ch.connected}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <code className="text-[11px] font-mono text-[--info-text]">
                            {ch.rules}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-[--success-bg] text-[--success-text]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[--success] animate-pulse" />
                            Active
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem className="text-xs gap-2">
                                <Eye className="h-3.5 w-3.5" /> View in explorer
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs gap-2">
                                <Pencil className="h-3.5 w-3.5" /> Edit channel
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs gap-2 text-[--danger]">
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
            </div>
          </TabsContent>

          {/* ─── RULES TAB ─── */}
          <TabsContent value="rules" className="flex-1 overflow-auto m-0">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-medium text-[--text-primary]">
                    Security Rules
                  </h2>
                  <p className="text-sm text-[--text-secondary] mt-1">
                    Define who can read and write to your realtime database.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Simulate
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-[--brand] hover:bg-[--brand-hover] text-white border-0"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Publish rules
                  </Button>
                </div>
              </div>

              <Alert className="border-[--warn-text]/20 bg-[--warn-bg]">
                <AlertTriangle className="h-4 w-4 text-[--warn-text]" />
                <AlertDescription className="text-[12.5px] text-[--warn-text]">
                  Your rules allow public read access. Consider restricting this
                  before going to production.
                </AlertDescription>
              </Alert>

              <div className="rounded-xl border border-[--border] bg-[--background] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[--border] bg-[--surface]">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[--text-secondary]" />
                    <span className="text-[13px] font-medium text-[--text-primary]">
                      rules.json
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                      JSON
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <textarea
                  className="w-full font-mono text-[12.5px] bg-[--background] text-[--text-primary] p-4 outline-none resize-none leading-relaxed h-72"
                  defaultValue={`{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid"
      }
    },
    "config": {
      ".read": "auth != null",
      ".write": "auth.token.role === 'admin'"
    }
  }
}`}
                  spellCheck={false}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
