// frontend/components/settings/ApiKeysClient.tsx
"use client";

import * as React from "react";
import {
  KeyRound, Plus, Trash2, Eye, EyeOff, Copy, Check,
  AlertTriangle, Loader2, Shield, Zap, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  key_type: "anon" | "service";
  label: string;
  is_active: boolean;
  created_at: string;
  raw_key?: string; // only present immediately after creation
}

interface Props {
  projectId: string;
  userId: string;
  initialKeys: ApiKey[];
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    }).format(new Date(iso));
  } catch { return iso; }
}

function KeyRow({
  apiKey,
  onRevoke,
  revoking,
}: {
  apiKey: ApiKey;
  onRevoke: (id: string) => void;
  revoking: string | null;
}) {
  const [revealed, setRevealed] = React.useState(!!apiKey.raw_key);
  const [copied, setCopied] = React.useState(false);

  const displayValue = apiKey.raw_key
    ? (revealed ? apiKey.raw_key : apiKey.raw_key.slice(0, 14) + "•".repeat(20) + apiKey.raw_key.slice(-4))
    : "sk_" + apiKey.key_type + "_" + "•".repeat(24);

  const handleCopy = async () => {
    if (!apiKey.raw_key) return;
    await navigator.clipboard.writeText(apiKey.raw_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAnon = apiKey.key_type === "anon";

  return (
    <div className={cn(
      "rounded-xl border bg-background p-4 transition-all",
      apiKey.raw_key ? "border-success/40 bg-success-bg/30" : "border-border"
    )}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            isAnon ? "bg-info-bg" : "bg-yellow-100 dark:bg-yellow-900/30"
          )}>
            {isAnon
              ? <Zap className="h-4 w-4 text-info-text" />
              : <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            }
          </div>
          <div>
            <p className="text-[13px] font-semibold text-text-primary">{apiKey.label}</p>
            <p className="text-[11px] text-text-muted">
              Created {formatDate(apiKey.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isAnon
              ? "bg-info-bg text-info-text"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          )}>
            {isAnon ? "Public" : "Secret"}
          </span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            apiKey.is_active
              ? "bg-success-bg text-success-text"
              : "bg-danger-bg text-danger-text"
          )}>
            {apiKey.is_active ? "Active" : "Revoked"}
          </span>
        </div>
      </div>

      {/* Key display */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 mb-3">
        <code className="flex-1 truncate font-mono text-[12px] text-text-primary">
          {displayValue}
        </code>
        {apiKey.raw_key && (
          <>
            <button
              onClick={() => setRevealed(!revealed)}
              className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
            >
              {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleCopy}
              className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </>
        )}
      </div>

      {apiKey.raw_key && (
        <div className="flex items-start gap-2 rounded-lg bg-warn-bg border border-warn-text/20 px-3 py-2 mb-3">
          <AlertTriangle className="h-3.5 w-3.5 text-warn-text shrink-0 mt-0.5" />
          <p className="text-[11px] text-warn-text leading-relaxed">
            Copy this key now — it won't be shown again. Store it securely.
            {!isAnon && " Never expose this service key in client-side code."}
          </p>
        </div>
      )}

      {apiKey.is_active && (
        <button
          onClick={() => onRevoke(apiKey.id)}
          disabled={revoking === apiKey.id}
          className="flex items-center gap-1.5 text-[12px] text-danger-text hover:text-danger transition-colors"
        >
          {revoking === apiKey.id
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Trash2 className="h-3.5 w-3.5" />}
          Revoke key
        </button>
      )}
    </div>
  );
}

export function ApiKeysClient({ projectId, userId, initialKeys }: Props) {
  const [keys, setKeys] = React.useState<ApiKey[]>(initialKeys);
  const [creating, setCreating] = React.useState(false);
  const [revoking, setRevoking] = React.useState<string | null>(null);
  const [createType, setCreateType] = React.useState<"anon" | "service">("anon");
  const [label, setLabel] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = async () => {
    if (!label.trim()) { setError("Label is required"); return; }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/internal/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          key_type: createType,
          label: label.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json?.error ?? "Failed to create key"); return; }
      const newKey: ApiKey = {
        id: json.data.id,
        key_type: createType,
        label: label.trim(),
        is_active: true,
        created_at: new Date().toISOString(),
        raw_key: json.data.key,
      };
      setKeys((prev) => [newKey, ...prev]);
      setLabel("");
      setShowForm(false);
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Revoke this API key? Any apps using it will lose access immediately.")) return;
    setRevoking(keyId);
    try {
      const res = await fetch(`/api/internal/api-keys/${keyId}`, { method: "DELETE" });
      if (res.ok) {
        setKeys((prev) => prev.map((k) => k.id === keyId ? { ...k, is_active: false } : k));
      }
    } finally {
      setRevoking(null);
    }
  };

  const activeKeys = keys.filter((k) => k.is_active);
  const revokedKeys = keys.filter((k) => !k.is_active);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[15px] font-semibold text-text-primary">API Keys</h2>
          <p className="text-[13px] text-text-muted mt-0.5">
            Authenticate your apps with these project keys
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand hover:bg-brand-hover text-white text-[13px] font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New key
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 mb-6">
          <p className="text-[13px] font-semibold text-text-primary mb-3">Create new API key</p>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-bg px-3 py-2 text-[12px] text-danger-text mb-3">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
            </div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] text-text-secondary mb-1.5">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Mobile app, Web frontend"
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-[13px] text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-[12px] text-text-secondary mb-1.5">Key type</label>
              <div className="flex gap-2">
                {(["anon", "service"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setCreateType(type)}
                    className={cn(
                      "flex-1 h-9 rounded-lg border text-[13px] font-medium transition-colors",
                      createType === type
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-background text-text-secondary hover:text-text-primary"
                    )}
                  >
                    {type === "anon" ? "Anon (Public)" : "Service (Secret)"}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-text-muted mt-1.5">
                {createType === "anon"
                  ? "Safe for client-side use. Restricted by Row Level Security."
                  : "Full access. Never expose in client-side code or public repos."}
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowForm(false); setError(null); setLabel(""); }}
                className="h-8 px-4 rounded-lg border border-border text-[13px] text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !label.trim()}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-[13px] font-medium transition-colors disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active keys */}
      {activeKeys.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border2 bg-background py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface">
            <KeyRound className="h-5 w-5 text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">No API keys yet</p>
            <p className="text-xs text-text-muted mt-1">Create your first key to start integrating</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-1 flex items-center gap-1.5 h-8 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-[13px] font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Create API key
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeKeys.map((key) => (
            <KeyRow key={key.id} apiKey={key} onRevoke={handleRevoke} revoking={revoking} />
          ))}
        </div>
      )}

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div className="mt-8">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-text-muted mb-3">
            Revoked keys
          </p>
          <div className="space-y-2 opacity-60">
            {revokedKeys.map((key) => (
              <KeyRow key={key.id} apiKey={key} onRevoke={handleRevoke} revoking={revoking} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}