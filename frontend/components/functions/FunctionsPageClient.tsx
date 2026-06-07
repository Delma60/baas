// frontend/components/functions/FunctionsPageClient.tsx
"use client";

import * as React from "react";
import {
  Zap,
  Plus,
  Play,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check,
  Loader2,
  ChevronRight,
  Clock,
  Globe,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Code2,
  RefreshCw,
  Activity,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { EdgeFunction, FunctionStats } from "@/lib/api/functions-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TestResult {
  status_code: number | null;
  response: unknown;
  error: string | null;
  duration_ms: number;
  success: boolean;
}

interface FunctionFormData {
  name: string;
  description: string;
  endpoint_url: string;
  method: string;
  timeout_ms: number;
}

const HTTP_METHODS = ["POST", "GET", "PUT", "PATCH", "DELETE"];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-[--info-bg] text-[--info-text]",
  POST: "bg-[--success-bg] text-[--success-text]",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DELETE: "bg-[--danger-bg] text-[--danger-text]",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return formatDate(iso);
}

function formatInvocations(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}

function tryPrettyJson(val: unknown): string {
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[--border] bg-[--background] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", color)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs text-[--text-secondary]">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-[--text-primary]">{value}</p>
    </div>
  );
}

// ─── Function Form Dialog ─────────────────────────────────────────────────────

function FunctionDialog({
  open,
  onClose,
  onSave,
  initial,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (fn: EdgeFunction) => void;
  initial?: EdgeFunction | null;
  projectId: string;
}) {
  const isEdit = !!initial;
  const [form, setForm] = React.useState<FunctionFormData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    endpoint_url: initial?.endpoint_url ?? "",
    method: initial?.method ?? "POST",
    timeout_ms: initial?.timeout_ms ?? 30000,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? "",
        description: initial?.description ?? "",
        endpoint_url: initial?.endpoint_url ?? "",
        method: initial?.method ?? "POST",
        timeout_ms: initial?.timeout_ms ?? 30000,
      });
      setError(null);
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.endpoint_url.trim()) { setError("Endpoint URL is required"); return; }
    if (!/^https?:\/\/.+/.test(form.endpoint_url.trim())) {
      setError("Endpoint URL must start with http:// or https://");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = isEdit
        ? `/api/internal/functions/${initial!.id}`
        : "/api/internal/functions";
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit
        ? { projectId, description: form.description, endpoint_url: form.endpoint_url, method: form.method, timeout_ms: form.timeout_ms }
        : { projectId, ...form };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.detail ?? data?.error ?? "Failed to save function");
        return;
      }
      // Rebuild the full function object for optimistic update
      const saved: EdgeFunction = isEdit
        ? { ...initial!, ...form, updated_at: new Date().toISOString() }
        : {
            id: data.data?.id ?? data.id ?? "",
            project_id: projectId,
            ...form,
            is_active: true,
            invoke_count: 0,
            last_invoked_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
      onSave(saved);
      onClose();
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit function" : "Create edge function"}</DialogTitle>
          <DialogDescription className="text-xs">
            Edge functions proxy HTTP requests to your external endpoint.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-[--danger-bg] bg-[--danger-bg] px-3 py-2 text-xs text-[--danger-text]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {!isEdit && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Function name <span className="text-[--danger-text]">*</span>
              </Label>
              <Input
                placeholder="e.g. send-welcome-email"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "-") }))}
                className="h-9 font-mono text-sm"
                autoFocus
              />
              <p className="text-[10px] text-[--text-muted]">
                Alphanumeric, hyphens, underscores only
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Input
              placeholder="What does this function do?"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Endpoint URL <span className="text-[--danger-text]">*</span>
            </Label>
            <Input
              placeholder="https://your-service.com/api/handler"
              value={form.endpoint_url}
              onChange={(e) => setForm((f) => ({ ...f, endpoint_url: e.target.value }))}
              className="h-9 font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">HTTP method</Label>
              <Select
                value={form.method}
                onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HTTP_METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="font-mono text-sm">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Timeout (ms)</Label>
              <Input
                type="number"
                min={1000}
                max={300000}
                step={1000}
                value={form.timeout_ms}
                onChange={(e) => setForm((f) => ({ ...f, timeout_ms: Number(e.target.value) }))}
                className="h-9 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={loading}
            className="bg-brand hover:bg-brand-hover text-white border-0 gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            {isEdit ? "Save changes" : "Create function"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Test Panel Dialog ────────────────────────────────────────────────────────

function TestDialog({
  fn,
  projectId,
  open,
  onClose,
}: {
  fn: EdgeFunction;
  projectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [payload, setPayload] = React.useState('{\n  \n}');
  const [payloadError, setPayloadError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<TestResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setResult(null);
      setPayloadError(null);
    }
  }, [open]);

  const handleTest = async () => {
    let parsedPayload: Record<string, unknown> = {};
    const trimmed = payload.trim();
    if (trimmed && trimmed !== "{}") {
      try {
        parsedPayload = JSON.parse(trimmed);
      } catch {
        setPayloadError("Invalid JSON payload");
        return;
      }
    }
    setPayloadError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/internal/functions/${fn.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, payload: parsedPayload }),
      });
      const data = await res.json();
      setResult(data.data ?? data);
    } catch {
      setResult({
        status_code: null,
        response: null,
        error: "Network error — could not reach backend",
        duration_ms: 0,
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(tryPrettyJson(result.response ?? result.error));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusColor = result?.success
    ? "text-[--success-text] bg-[--success-bg]"
    : "text-[--danger-text] bg-[--danger-bg]";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Play className="h-4 w-4 text-brand" />
            <DialogTitle>Test function</DialogTitle>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold font-mono", METHOD_COLORS[fn.method])}>
              {fn.method}
            </span>
            <code className="text-xs text-[--text-secondary] truncate max-w-xs">{fn.endpoint_url}</code>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Payload editor */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Code2 className="h-3 w-3 text-[--text-muted]" />
              Request payload (JSON)
            </Label>
            <Textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="font-mono text-xs min-h-[120px] resize-y bg-[--code-bg] text-[--code-text]"
              placeholder='{ "key": "value" }'
              spellCheck={false}
            />
            {payloadError && (
              <p className="text-[11px] text-[--danger-text] flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />{payloadError}
              </p>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Response</Label>
                <div className="flex items-center gap-2">
                  {result.status_code && (
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold font-mono", statusColor)}>
                      {result.status_code}
                    </span>
                  )}
                  <span className="text-[10px] text-[--text-muted] flex items-center gap-1">
                    <Clock className="h-3 w-3" />{result.duration_ms}ms
                  </span>
                  <button
                    className="flex h-6 w-6 items-center justify-center rounded border border-[--border] text-[--text-muted] hover:text-[--text-primary] transition-colors"
                    onClick={copyResponse}
                  >
                    {copied ? <Check className="h-3 w-3 text-[--success-text]" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {result.error ? (
                <div className="rounded-lg border border-[--danger-bg] bg-[--danger-bg] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="h-4 w-4 text-[--danger-text] shrink-0" />
                    <span className="text-xs font-semibold text-[--danger-text]">Error</span>
                  </div>
                  <p className="text-xs font-mono text-[--danger-text]">{result.error}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-[--border] bg-[--code-bg] overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[--border] bg-[--surface]">
                    {result.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[--success-text]" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-[--danger-text]" />
                    )}
                    <span className="text-[10px] text-[--text-muted]">
                      {result.success ? "Success" : "Error response"}
                    </span>
                  </div>
                  <pre className="p-3 text-[11.5px] font-mono text-[--code-text] overflow-x-auto max-h-52">
                    {tryPrettyJson(result.response)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-2 border-t border-[--border]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleTest}
            disabled={loading}
            className="gap-1.5 bg-[--success-bg] text-[--success-text] border border-[--success-text]/20 hover:bg-[--success-text]/10"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {loading ? "Invoking…" : "Run test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Function Card ────────────────────────────────────────────────────────────

function FunctionCard({
  fn,
  projectId,
  onEdit,
  onDelete,
  onTest,
  onToggle,
}: {
  fn: EdgeFunction;
  projectId: string;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onToggle: () => void;
}) {
  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(fn.endpoint_url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div
      className={cn(
        "group rounded-xl border bg-[--background] p-5 transition-all hover:shadow-sm",
        fn.is_active ? "border-[--border]" : "border-[--border] opacity-60"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              fn.is_active ? "bg-brand/10" : "bg-[--surface]"
            )}
          >
            <Zap className={cn("h-4 w-4", fn.is_active ? "text-brand" : "text-[--text-muted]")} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-[--text-primary] font-mono">{fn.name}</p>
              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold font-mono shrink-0", METHOD_COLORS[fn.method])}>
                {fn.method}
              </span>
            </div>
            {fn.description && (
              <p className="text-xs text-[--text-secondary] mt-0.5 truncate">{fn.description}</p>
            )}
          </div>
        </div>

        {/* Status toggle */}
        <button
          onClick={onToggle}
          className="shrink-0 text-[--text-muted] hover:text-[--text-primary] transition-colors"
          title={fn.is_active ? "Disable function" : "Enable function"}
        >
          {fn.is_active ? (
            <ToggleRight className="h-5 w-5 text-[--success-text]" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Endpoint URL */}
      <div className="flex items-center gap-2 rounded-lg bg-[--surface] border border-[--border] px-3 py-2 mb-3">
        <Globe className="h-3 w-3 text-[--text-muted] shrink-0" />
        <code className="flex-1 text-[11px] text-[--text-secondary] truncate font-mono">
          {fn.endpoint_url}
        </code>
        <button
          onClick={copyUrl}
          className="shrink-0 text-[--text-muted] hover:text-[--text-primary] transition-colors"
        >
          {copiedUrl ? (
            <Check className="h-3 w-3 text-[--success-text]" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-4 text-[11px] text-[--text-muted]">
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          {formatInvocations(fn.invoke_count)} invocations
        </span>
        <span className="text-[--border2]">·</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatRelative(fn.last_invoked_at)}
        </span>
        <span className="text-[--border2]">·</span>
        <span>{fn.timeout_ms / 1000}s timeout</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[--border]">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs flex-1"
          onClick={onTest}
          disabled={!fn.is_active}
        >
          <Play className="h-3 w-3" />
          Test
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1.5 text-xs px-3"
          onClick={onEdit}
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 text-[--danger-text] border-[--danger-text]/20 hover:bg-[--danger-bg]"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyFunctions({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-[--border2] bg-[--surface]">
        <Zap className="h-7 w-7 text-[--text-muted]" />
      </div>
      <div className="text-center max-w-sm">
        <p className="text-sm font-medium text-[--text-primary]">No edge functions yet</p>
        <p className="text-xs text-[--text-muted] mt-1 leading-relaxed">
          Edge functions proxy requests to your external HTTP endpoints. Register an
          endpoint to invoke it via the SDK or dashboard.
        </p>
      </div>
      <Button
        size="sm"
        className="h-8 gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0"
        onClick={onNew}
      >
        <Plus className="h-3.5 w-3.5" />
        Create your first function
      </Button>

      {/* SDK snippet */}
      <div className="mt-2 w-full max-w-sm rounded-xl border border-[--border] bg-[--surface] p-4">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[--text-muted] mb-2">
          Invoke via SDK
        </p>
        <pre className="text-[11.5px] font-mono text-[--text-secondary] leading-relaxed overflow-x-auto">
          <code>{`const result = await baas
  .functions()
  .invoke('my-function', {
    payload: { userId: '123' },
  })`}</code>
        </pre>
      </div>
    </div>
  );
}

// ─── Main Page Client ─────────────────────────────────────────────────────────

interface FunctionsPageClientProps {
  projectId: string;
  userId: string;
  initialFunctions: EdgeFunction[];
  initialStats: {
    total: number;
    active: number;
    inactive: number;
    total_invocations: number;
  };
}

export function FunctionsPageClient({
  projectId,
  userId,
  initialFunctions,
  initialStats,
}: FunctionsPageClientProps) {
  const [functions, setFunctions] = React.useState<EdgeFunction[]>(initialFunctions);
  const [stats, setStats] = React.useState(initialStats);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Dialogs
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<EdgeFunction | null>(null);
  const [testTarget, setTestTarget] = React.useState<EdgeFunction | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Recompute stats from local state
  const computedStats = React.useMemo(() => ({
    total: functions.length,
    active: functions.filter((f) => f.is_active).length,
    inactive: functions.filter((f) => !f.is_active).length,
    total_invocations: functions.reduce((acc, f) => acc + f.invoke_count, 0),
  }), [functions]);

  // ── CRUD handlers ────────────────────────────────────────────────────────

  const handleSaved = (fn: EdgeFunction) => {
    setFunctions((prev) => {
      const idx = prev.findIndex((f) => f.id === fn.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fn;
        return next;
      }
      return [fn, ...prev];
    });
  };

  const handleDelete = async (fn: EdgeFunction) => {
    if (!confirm(`Delete "${fn.name}"? This cannot be undone.`)) return;
    setDeletingId(fn.id);
    try {
      const res = await fetch(
        `/api/internal/functions/${fn.id}?projectId=${encodeURIComponent(projectId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setFunctions((prev) => prev.filter((f) => f.id !== fn.id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (fn: EdgeFunction) => {
    const next = !fn.is_active;
    // Optimistic
    setFunctions((prev) =>
      prev.map((f) => (f.id === fn.id ? { ...f, is_active: next } : f))
    );
    try {
      const res = await fetch(`/api/internal/functions/${fn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, is_active: next }),
      });
      if (!res.ok) {
        // Revert
        setFunctions((prev) =>
          prev.map((f) => (f.id === fn.id ? { ...f, is_active: !next } : f))
        );
      }
    } catch {
      setFunctions((prev) =>
        prev.map((f) => (f.id === fn.id ? { ...f, is_active: !next } : f))
      );
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/functions?projectId=${projectId}`,
        { cache: "no-store" }
      );
      // Use the dedicated functions endpoint instead
      const r2 = await fetch(
        `/api/internal/functions?projectId=${projectId}`,
        { cache: "no-store" }
      );
      if (r2.ok) {
        const data = await r2.json();
        setFunctions(data.data?.functions ?? data.functions ?? []);
      }
    } catch {
      // non-fatal
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-[--border] px-4 sm:px-6 py-4 sm:py-5 bg-[--background] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand/10">
            <Zap className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h1 className="text-base font-medium text-[--text-primary]">Edge Functions</h1>
            <p className="text-sm text-[--text-secondary] mt-0.5 hidden sm:block">
              Register external HTTP endpoints and invoke them via the SDK
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New function</span>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 sm:px-6 py-4 border-b border-[--border] bg-[--background] shrink-0">
        <StatCard
          label="Total functions"
          value={computedStats.total}
          icon={Zap}
          color="bg-brand/10 text-brand"
        />
        <StatCard
          label="Active"
          value={computedStats.active}
          icon={CheckCircle2}
          color="bg-[--success-bg] text-[--success-text]"
        />
        <StatCard
          label="Inactive"
          value={computedStats.inactive}
          icon={XCircle}
          color="bg-[--surface] text-[--text-muted]"
        />
        <StatCard
          label="Total invocations"
          value={formatInvocations(computedStats.total_invocations)}
          icon={Activity}
          color="bg-[--info-bg] text-[--info-text]"
        />
      </div>

      {/* SDK endpoint hint */}
      {functions.length > 0 && (
        <div className="px-4 sm:px-6 py-3 border-b border-[--border] bg-[--surface] shrink-0">
          <div className="flex items-center gap-2 text-[11.5px] text-[--text-muted]">
            <Code2 className="h-3.5 w-3.5 shrink-0" />
            <span>Invoke via API:</span>
            <code className="font-mono bg-[--code-bg] border border-[--border] rounded px-1.5 py-0.5 text-[--code-text]">
              POST /v1/functions/{"{projectId}"}/invoke/{"{functionName}"}
            </code>
          </div>
        </div>
      )}

      {/* Function grid */}
      <div className="flex-1 overflow-y-auto">
        {functions.length === 0 ? (
          <EmptyFunctions onNew={() => setCreateOpen(true)} />
        ) : (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {functions.map((fn) => (
              <div key={fn.id} className="relative">
                {deletingId === fn.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[--background]/70">
                    <Loader2 className="h-5 w-5 animate-spin text-[--text-muted]" />
                  </div>
                )}
                <FunctionCard
                  fn={fn}
                  projectId={projectId}
                  onEdit={() => setEditTarget(fn)}
                  onDelete={() => handleDelete(fn)}
                  onTest={() => setTestTarget(fn)}
                  onToggle={() => handleToggle(fn)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <FunctionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleSaved}
        projectId={projectId}
      />

      <FunctionDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleSaved}
        initial={editTarget}
        projectId={projectId}
      />

      {testTarget && (
        <TestDialog
          fn={testTarget}
          projectId={projectId}
          open={!!testTarget}
          onClose={() => setTestTarget(null)}
        />
      )}
    </div>
  );
}