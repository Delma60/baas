"use client";

import * as React from "react";
import {
  Radio,
  Plus,
  RefreshCw,
  Copy,
  ChevronRight,
  ChevronDown,
  Circle,
  Activity,
  Zap,
  Lock,
  Shield,
  Globe,
  Trash2,
  MoreHorizontal,
  Code2,
  ArrowUpRight,
  Wifi,
  WifiOff,
  Clock,
  Filter,
  Download,
  Search,
  Eye,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ─── Mock data ────────────────────────────────────────────────────────────────

const DB_URL = "https://ajo-app-929ee-default-rtdb.yourbaas.io";

const MOCK_DATA = {
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

const MOCK_EVENTS = [
  {
    id: 1,
    type: "set",
    path: "/users/uid_004",
    data: '{"name":"Tunde Bakare","status":"online"}',
    ts: "12:04:31",
    client: "web-sdk",
  },
  {
    id: 2,
    type: "update",
    path: "/users/uid_001/status",
    data: '"online"',
    ts: "12:04:28",
    client: "mobile-sdk",
  },
  {
    id: 3,
    type: "remove",
    path: "/messages/room_general/msg_old",
    data: "null",
    ts: "12:04:15",
    client: "server-sdk",
  },
  {
    id: 4,
    type: "set",
    path: "/presence/uid_002",
    data: "false",
    ts: "12:03:58",
    client: "web-sdk",
  },
  {
    id: 5,
    type: "update",
    path: "/config/featureFlags/betaSearch",
    data: "true",
    ts: "12:03:44",
    client: "server-sdk",
  },
  {
    id: 6,
    type: "set",
    path: "/messages/room_dev/msg_004",
    data: '{"text":"New feature!","uid":"uid_001"}',
    ts: "12:03:22",
    client: "web-sdk",
  },
  {
    id: 7,
    type: "remove",
    path: "/users/uid_005",
    data: "null",
    ts: "12:03:01",
    client: "server-sdk",
  },
  {
    id: 8,
    type: "set",
    path: "/users/uid_003/lastSeen",
    data: "1749167100",
    ts: "12:02:48",
    client: "mobile-sdk",
  },
];

const CHANNELS = [
  {
    id: "ch_1",
    name: "users",
    path: "/users",
    connected: 12,
    rules: "auth != null",
  },
  {
    id: "ch_2",
    name: "messages",
    path: "/messages",
    connected: 8,
    rules: "auth != null",
  },
  {
    id: "ch_3",
    name: "presence",
    path: "/presence",
    connected: 12,
    rules: "auth != null",
  },
  {
    id: "ch_4",
    name: "config",
    path: "/config",
    connected: 1,
    rules: "auth.role == 'admin'",
  },
];

const EVENT_TYPE_STYLES: Record<string, { color: string; bg: string }> = {
  set: {
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  update: {
    color: "text-sky-700 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
  },
  remove: {
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/40",
  },
};

// ─── JSON Tree ────────────────────────────────────────────────────────────────

function JsonNode({
  keyName,
  value,
  depth = 0,
  defaultOpen = false,
}: {
  keyName: string;
  value: unknown;
  depth?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen || depth < 1);
  const isObject = value !== null && typeof value === "object";
  const entries = isObject
    ? Object.entries(value as Record<string, unknown>)
    : [];

  const valueColor =
    typeof value === "string"
      ? "text-amber-600 dark:text-amber-400"
      : typeof value === "number"
        ? "text-violet-600 dark:text-violet-400"
        : typeof value === "boolean"
          ? "text-sky-600 dark:text-sky-400"
          : value === null
            ? "text-rose-500 dark:text-rose-400 italic"
            : "text-foreground";

  if (!isObject) {
    return (
      <div
        className="flex items-center gap-1.5 py-0.5 group"
        style={{ paddingLeft: depth * 16 + 8 }}
      >
        <span className="text-[12px] font-medium text-muted-foreground">
          {keyName}:
        </span>
        <span className={cn("text-[12px] font-mono", valueColor)}>
          {typeof value === "string" ? `"${value}"` : String(value)}
        </span>
        <button className="opacity-0 group-hover:opacity-100 ml-auto transition-opacity">
          <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        className="flex w-full items-center gap-1 py-0.5 hover:bg-muted/40 rounded-sm transition-colors group"
        style={{ paddingLeft: depth * 16 + 4 }}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="text-[12px] font-semibold text-foreground">
          {keyName}
        </span>
        {!open && (
          <span className="text-[11px] text-muted-foreground ml-1">
            {`{${entries.length}}`}
          </span>
        )}
        <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 pr-2 transition-opacity">
          <Plus className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </div>
      </button>
      {open && (
        <div
          className="border-l border-border/40 ml-[13px]"
          style={{ marginLeft: depth * 16 + 13 }}
        >
          {entries.map(([k, v]) => (
            <JsonNode key={k} keyName={k} value={v} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Connection status pill ───────────────────────────────────────────────────

function StatusPill({ connected }: { connected: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        connected
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
          : "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500",
        )}
      />
      {connected ? "Connected" : "Disconnected"}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RealtimePage() {
  const [connected] = React.useState(true);
  const [selectedPath, setSelectedPath] = React.useState("/");
  const [pathInput, setPathInput] = React.useState(DB_URL + "/");
  const [eventFilter, setEventFilter] = React.useState<
    "all" | "set" | "update" | "remove"
  >("all");
  const [liveEvents, setLiveEvents] = React.useState(true);
  const [newChannelOpen, setNewChannelOpen] = React.useState(false);

  const filteredEvents =
    eventFilter === "all"
      ? MOCK_EVENTS
      : MOCK_EVENTS.filter((e) => e.type === eventFilter);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 h-14 border-b shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              <h1 className="text-[15px] font-semibold tracking-tight">
                Realtime Database
              </h1>
            </div>
            <StatusPill connected={connected} />
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>

            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <Code2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">SDK Setup</span>
            </Button>

            <Dialog open={newChannelOpen} onOpenChange={setNewChannelOpen}>
              <DialogTrigger>
                <Button size="sm" className="h-8 gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">New Channel</span>
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
                    <p className="text-[11px] text-muted-foreground">
                      Clients subscribed to this channel will receive updates
                      for this path and all its children.
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
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-[13px] font-medium">
                        Presence tracking
                      </p>
                      <p className="text-[11px] text-muted-foreground">
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
                  <Button size="sm" onClick={() => setNewChannelOpen(false)}>
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
          <div className="border-b px-6 shrink-0">
            <TabsList className="h-10 bg-transparent p-0 gap-0 rounded-none">
              {["data", "channels", "rules", "usage"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="capitalize rounded-none border-b-2 border-transparent px-4 pb-2 pt-1 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ─── DATA TAB ─── */}
          <TabsContent value="data" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              {/* JSON Tree panel */}
              <div className="flex flex-col border-r w-[380px] shrink-0 overflow-hidden">
                {/* Path bar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/20 shrink-0">
                  <div className="flex-1 flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[12px] font-mono text-muted-foreground overflow-hidden">
                    <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{pathInput}</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => navigator.clipboard.writeText(pathInput)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy URL</TooltipContent>
                  </Tooltip>
                </div>

                {/* Tree */}
                <ScrollArea className="flex-1 px-2 py-2">
                  {Object.entries(MOCK_DATA).map(([k, v]) => (
                    <JsonNode
                      key={k}
                      keyName={k}
                      value={v}
                      depth={0}
                      defaultOpen={k === "users"}
                    />
                  ))}
                </ScrollArea>

                {/* Add node */}
                <div className="border-t px-3 py-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add node
                  </Button>
                </div>
              </div>

              {/* Event stream panel */}
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20 shrink-0 gap-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[12.5px] font-medium">
                      Event Stream
                    </span>
                    {liveEvents && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={eventFilter}
                      onValueChange={(v) =>
                        setEventFilter(v as typeof eventFilter)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs w-28">
                        <Filter className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">
                          All events
                        </SelectItem>
                        <SelectItem value="set" className="text-xs">
                          set
                        </SelectItem>
                        <SelectItem value="update" className="text-xs">
                          update
                        </SelectItem>
                        <SelectItem value="remove" className="text-xs">
                          remove
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant={liveEvents ? "default" : "outline"}
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setLiveEvents((l) => !l)}
                        >
                          {liveEvents ? (
                            <Wifi className="h-3.5 w-3.5" />
                          ) : (
                            <WifiOff className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {liveEvents ? "Pause stream" : "Resume stream"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export events</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="divide-y divide-border/50">
                    {filteredEvents.map((event, i) => {
                      const style = EVENT_TYPE_STYLES[event.type];
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "flex items-start gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors group",
                            i === 0 &&
                              liveEvents &&
                              "animate-in slide-in-from-top-2",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0",
                              style.color,
                              style.bg,
                            )}
                          >
                            {event.type}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-mono text-foreground truncate">
                              {event.path}
                            </p>
                            <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
                              {event.data}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {event.ts}
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0 h-4"
                            >
                              {event.client}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <div className="border-t px-4 py-2 bg-muted/10 flex items-center justify-between shrink-0">
                  <span className="text-[11px] text-muted-foreground">
                    {filteredEvents.length} events
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                  >
                    Clear log
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ─── CHANNELS TAB ─── */}
          <TabsContent
            value="channels"
            className="flex-1 overflow-auto m-0 p-6"
          >
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold">Channels</h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Channels define which paths clients can subscribe to and
                    listen for changes.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setNewChannelOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> New channel
                </Button>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Active channels",
                    value: "4",
                    icon: Radio,
                    color: "text-violet-600",
                  },
                  {
                    label: "Connected clients",
                    value: "33",
                    icon: Wifi,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Events / sec",
                    value: "2.4",
                    icon: Zap,
                    color: "text-amber-600",
                  },
                  {
                    label: "Avg latency",
                    value: "18ms",
                    icon: Activity,
                    color: "text-sky-600",
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <s.icon className={cn("h-3.5 w-3.5", s.color)} />
                      <span className="text-[11px] text-muted-foreground">
                        {s.label}
                      </span>
                    </div>
                    <p className="text-[22px] font-semibold tracking-tight">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Channels table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                        Channel
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                        Path
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                        Connected
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider hidden md:table-cell">
                        Access rule
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {CHANNELS.map((ch) => (
                      <TableRow key={ch.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[13px] font-medium">
                              {ch.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-[12px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {ch.path}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-[13px] tabular-nums">
                              {ch.connected}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <code className="text-[11px] font-mono text-sky-600 dark:text-sky-400">
                            {ch.rules}
                          </code>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem className="text-xs gap-2">
                                <Eye className="h-3.5 w-3.5" /> View events
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs gap-2">
                                <Pencil className="h-3.5 w-3.5" /> Edit channel
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive">
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
          <TabsContent value="rules" className="flex-1 overflow-auto m-0 p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold">Security rules</h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Define who can read and write to your realtime database.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" /> Simulate
                  </Button>
                  <Button size="sm" className="h-8 text-xs">
                    Publish rules
                  </Button>
                </div>
              </div>

              <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-[12.5px] text-amber-700 dark:text-amber-400">
                  Your rules are publicly readable. Consider locking down read
                  access for production.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[12.5px] font-medium">
                      rules.json
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] h-5">
                      JSON
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <textarea
                  className="w-full font-mono text-[12.5px] bg-background p-4 outline-none resize-none leading-relaxed h-64 text-foreground"
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

          {/* ─── USAGE TAB ─── */}
          <TabsContent value="usage" className="flex-1 overflow-auto m-0 p-6">
            <div className="max-w-3xl mx-auto space-y-5">
              <div>
                <h2 className="text-[15px] font-semibold">Usage</h2>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Last 30 days
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Data transferred",
                    value: "1.24 GB",
                    limit: "5 GB",
                    pct: 25,
                    color: "bg-violet-500",
                  },
                  {
                    label: "Simultaneous connections",
                    value: "33",
                    limit: "100",
                    pct: 33,
                    color: "bg-sky-500",
                  },
                  {
                    label: "Database size",
                    value: "48 MB",
                    limit: "1 GB",
                    pct: 5,
                    color: "bg-emerald-500",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-muted-foreground">
                        {m.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {m.limit} limit
                      </span>
                    </div>
                    <p className="text-[22px] font-semibold tracking-tight">
                      {m.value}
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          m.color,
                        )}
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {m.pct}% of limit used
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/30">
                  <h3 className="text-[13px] font-semibold">
                    Events breakdown
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableHead className="text-[11px] uppercase tracking-wider">
                        Event type
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-right">
                        Count
                      </TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-right">
                        Avg / day
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { type: "set", count: "48,203", avg: "1,607" },
                      { type: "update", count: "31,890", avg: "1,063" },
                      { type: "remove", count: "4,411", avg: "147" },
                    ].map((row) => {
                      const style = EVENT_TYPE_STYLES[row.type];
                      return (
                        <TableRow key={row.type}>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                style.color,
                                style.bg,
                              )}
                            >
                              {row.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-[13px]">
                            {row.count}
                          </TableCell>
                          <TableCell className="text-right font-mono text-[13px] text-muted-foreground">
                            {row.avg}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
