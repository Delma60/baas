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
  ArrowUpRight,
  Pencil,
  AlertTriangle,
  Search,
  Eye,
  Save,
  X,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import type { RealtimeChannel, RealtimeStats } from "@/lib/api/realtime-client";

// ─── Props ────────────────────────────────────────────────────────────────────

interface RealtimePageClientProps {
  projectId: string;
  initialChannels: RealtimeChannel[];
  initialStats: RealtimeStats;
  initialRules: string;
  dbUrl: string;
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

// ─── Create channel dialog ────────────────────────────────────────────────────

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
    if (!name.trim() || !path.trim()) return;
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
        setError(data?.detail ?? data?.error ?? "Failed to create channel");
        return;
      }
      onCreated({
        id: data.data?.id ?? data.id,
        name: name.trim(),
        path: path.trim(),
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
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Channel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create channel</DialogTitle>
          <DialogDescription>
            Subscribe clients to a database path. Changes at this path and below
            will be broadcast in realtime.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && (
            <Alert className="border-red-200 bg-[--danger-bg]">
              <AlertTriangle className="h-4 w-4 text-[--danger-text]" />
              <AlertDescription className="text-[12.5px] text-[--danger-text]">
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
            <p className="text-[11px] text-[--text-muted]">
              Clients subscribed to this channel receive updates for this path
              and all children.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Access rule</Label>
            <Input
              value={rule}
              onChange={(e) => setRule(e.target.value)}
              className="h-9 text-sm font-mono"
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
            {loading ? <Spinner className="h-3.5 w-3.5" /> : "Create channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Channels tab ─────────────────────────────────────────────────────────────

function ChannelsTab({
  projectId,
  channels,
  stats,
  onChannelsChange,
}: {
  projectId: string;
  channels: RealtimeChannel[];
  stats: RealtimeStats;
  onChannelsChange: (chs: RealtimeChannel[]) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const filtered = channels.filter(
    (ch) =>
      !search ||
      ch.name.toLowerCase().includes(search.toLowerCase()) ||
      ch.path.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (channelId: string) => {
    if (!confirm("Delete this channel? Clients will stop receiving updates."))
      return;
    setDeletingId(channelId);
    try {
      const res = await fetch(
        `/api/internal/realtime/channels/${channelId}?projectId=${projectId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        onChannelsChange(channels.filter((ch) => ch.id !== channelId));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-medium text-[--text-primary]">
            Channels
          </h2>
          <p className="text-sm text-[--text-secondary] mt-1">
            Define which paths clients can subscribe to and receive live updates
            from.
          </p>
        </div>
        <CreateChannelDialog
          projectId={projectId}
          onCreated={(ch) => onChannelsChange([ch, ...channels])}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Radio}
          label="Active channels"
          value={String(stats.active_channels)}
          iconColor="text-[--danger-text]"
          iconBg="bg-[--danger-bg]"
        />
        <StatCard
          icon={Wifi}
          label="Connected clients"
          value={String(stats.connected_clients)}
          iconColor="text-[--success-text]"
          iconBg="bg-[--success-bg]"
        />
        <StatCard
          icon={Shield}
          label="With presence"
          value={String(stats.presence_channels)}
          iconColor="text-[--info-text]"
          iconBg="bg-[--info-bg]"
        />
        <StatCard
          icon={Globe}
          label="Total channels"
          value={String(stats.total_channels)}
          iconColor="text-[--warn-text]"
          iconBg="bg-[--warn-bg]"
        />
      </div>

      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[--border2] bg-[--surface] py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[--background] border border-[--border]">
            <Radio className="h-5 w-5 text-[--text-muted]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[--text-primary]">
              No channels yet
            </p>
            <p className="text-xs text-[--text-muted] mt-1">
              Create a channel to start broadcasting realtime events to clients.
            </p>
          </div>
          <CreateChannelDialog
            projectId={projectId}
            onCreated={(ch) => onChannelsChange([ch, ...channels])}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-[--border] bg-[--background] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[--border] bg-[--surface]">
            <span className="text-xs text-[--text-muted]">
              {channels.length} channels
            </span>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[--text-muted] pointer-events-none" />
              <input
                type="text"
                placeholder="Filter…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 pl-7 pr-3 text-xs rounded-lg border border-[--border] bg-[--background] text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-brand transition-colors w-36"
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
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted] hidden md:table-cell">
                  Access rule
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted]">
                  Presence
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted]">
                  Status
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ch) => (
                <TableRow
                  key={ch.id}
                  className="group border-b border-[--border] hover:bg-[--surface] transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          ch.is_active ? "bg-[--success]" : "bg-[--text-muted]",
                        )}
                      />
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
                  <TableCell className="hidden md:table-cell">
                    <code className="text-[11px] font-mono text-[--info-text]">
                      {ch.access_rule}
                    </code>
                  </TableCell>
                  <TableCell>
                    {ch.enable_presence ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 text-[--success-text] border-[--success-bg]"
                      >
                        On
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5"
                      >
                        Off
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        ch.is_active
                          ? "bg-[--success-bg] text-[--success-text]"
                          : "bg-[--surface] text-[--text-muted]",
                      )}
                    >
                      {ch.is_active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[--success] animate-pulse" />
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
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={deletingId === ch.id}
                        >
                          {deletingId === ch.id ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : (
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          className="text-xs gap-2"
                          onClick={() => navigator.clipboard.writeText(ch.path)}
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy path
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs gap-2 text-[--danger]"
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

      {/* SDK snippet */}
      <div className="rounded-xl border border-[--border] bg-[--surface] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted] mb-3">
          SDK — Subscribe to a channel
        </p>
        <pre className="text-[12px] font-mono text-[--text-secondary] overflow-x-auto leading-relaxed">
          <code>{`const unsub = baas.realtime.on('${channels[0]?.name ?? "posts"}', (event) => {
  console.log(event.type, event.record) // INSERT | UPDATE | DELETE
})

// Cleanup
unsub()`}</code>
        </pre>
      </div>
    </div>
  );
}

// ─── Rules tab ────────────────────────────────────────────────────────────────

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
      // Validate JSON
      JSON.parse(rules);
    } catch {
      setError("Invalid JSON — please fix the syntax before saving.");
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
        const data = await res.json().catch(() => ({}));
        setError(data?.detail ?? "Failed to save rules");
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

  const hasPublicRead =
    rules.includes('"auth": null') || rules.includes('".read": true');

  return (
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
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <ArrowUpRight className="h-3.5 w-3.5" />
            Simulate
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-brand hover:bg-brand-hover text-white border-0"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Spinner className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saved ? "Saved!" : "Publish rules"}
          </Button>
        </div>
      </div>

      {hasPublicRead && (
        <Alert className="border-[--warn-text]/20 bg-[--warn-bg]">
          <AlertTriangle className="h-4 w-4 text-[--warn-text]" />
          <AlertDescription className="text-[12.5px] text-[--warn-text]">
            Your rules may allow public read access. Consider restricting this
            before going to production.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-[--danger-bg]">
          <AlertTriangle className="h-4 w-4 text-[--danger-text]" />
          <AlertDescription className="text-[12.5px] text-[--danger-text]">
            {error}
          </AlertDescription>
        </Alert>
      )}

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
          className="w-full font-mono text-[12.5px] bg-[--background] text-[--text-primary] p-4 outline-none resize-none leading-relaxed h-80"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="rounded-xl border border-[--border] bg-[--surface] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[--text-muted] mb-2">
          Rule variables
        </p>
        <div className="grid grid-cols-2 gap-2 text-[12px] text-[--text-secondary]">
          <div>
            <code className="text-[--info-text]">auth</code> — authenticated
            user object
          </div>
          <div>
            <code className="text-[--info-text]">auth.uid</code> — user ID
          </div>
          <div>
            <code className="text-[--info-text]">auth.role</code> — user role
            claim
          </div>
          <div>
            <code className="text-[--info-text]">now</code> — current timestamp
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RealtimePageClient({
  projectId,
  initialChannels,
  initialStats,
  initialRules,
  dbUrl,
}: RealtimePageClientProps) {
  const [channels, setChannels] =
    React.useState<RealtimeChannel[]>(initialChannels);
  const [stats, setStats] = React.useState<RealtimeStats>(initialStats);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[--bg3]">
      {/* Page Header */}
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
              Manage channels and security rules for live data subscriptions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionBadge connected={true} />
          <div className="w-px h-5 bg-[--border]" />
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Code2 className="h-3.5 w-3.5" />
            SDK Setup
          </Button>
        </div>
      </div>

      {/* DB URL bar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-[--border] bg-[--surface]">
        <Globe className="h-3.5 w-3.5 text-[--text-muted] shrink-0" />
        <span className="text-[12px] font-mono text-[--text-muted] truncate flex-1">
          {dbUrl}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={() => navigator.clipboard.writeText(dbUrl)}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="channels"
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="border-b border-[--border] bg-[--background] px-6">
          <TabsList className="h-11 bg-transparent p-0 gap-0 rounded-none">
            {[
              { value: "channels", label: "Channels" },
              { value: "rules", label: "Security Rules" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-1 text-[13px] text-[--text-secondary] data-[state=active]:border-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-brand data-[state=active]:font-medium transition-colors"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="channels" className="flex-1 overflow-auto m-0">
          <ChannelsTab
            projectId={projectId}
            channels={channels}
            stats={stats}
            onChannelsChange={setChannels}
          />
        </TabsContent>

        <TabsContent value="rules" className="flex-1 overflow-auto m-0">
          <RulesTab projectId={projectId} initialRules={initialRules} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
