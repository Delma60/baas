// frontend/components/settings/GeneralSettingsClient.tsx
"use client";

import * as React from "react";
import { Copy, Check, Pencil, X, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectSettings {
  id: string;
  name: string;
  slug: string;
  region: string;
  status: "active" | "paused" | "deleted";
  db_schema: string;
  mongo_database: string;
  created_at: string;
  org_id: string;
  org_name: string;
  org_plan: string;
}

interface Props {
  projectId: string;
  userId: string;
  settings: ProjectSettings;
  regionLabel: string;
}

// ─── Copy field ───────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  copyable = false,
  mono = false,
  editable = false,
  onSave,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  mono?: boolean;
  editable?: boolean;
  onSave?: (val: string) => Promise<void>;
}) {
  const [copied, setCopied] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editVal, setEditVal] = React.useState(value);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!onSave || editVal === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(editVal);
    setSaving(false);
    setEditing(false);
  };

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0 gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-text-secondary mb-0.5">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              ref={inputRef}
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              className="h-8 rounded-md border border-brand bg-background px-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand w-full max-w-xs font-mono"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-8 px-3 rounded-md bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-colors flex items-center gap-1"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditVal(value); }}
              className="h-8 px-2 rounded-md border border-border text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className={cn(
            "text-[14px] text-text-primary",
            mono && "font-mono text-[13px]"
          )}>
            {value}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {editable && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-surface"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        {copyable && !editing && (
          <button
            onClick={handleCopy}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded hover:bg-surface"
          >
            {copied
              ? <Check className="h-3.5 w-3.5 text-success" />
              : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden mb-5">
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[13px] font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="text-[12px] text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

// ─── Environment select ───────────────────────────────────────────────────────

function EnvTypeRow({ projectId }: { projectId: string }) {
  const [value, setValue] = React.useState("Production");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const options = ["Production", "Staging", "Development", "Unspecified"];

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue(e.target.value);
    setSaving(true);
    // Fire-and-forget update
    await fetch(`/api/internal/settings?projectId=${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ environment_type: e.target.value }),
    }).catch(() => {});
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="text-[13px] text-text-secondary mb-0.5">Environment type</p>
        <p className="text-[12px] text-text-muted">
          This setting customizes your project for different stages of the app lifecycle
        </p>
      </div>
      <div className="flex items-center gap-2">
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-text-muted" />}
        {saved && <Check className="h-3.5 w-3.5 text-success" />}
        <div className="relative">
          <select
            value={value}
            onChange={handleChange}
            className="appearance-none h-8 pl-3 pr-8 rounded-md border border-border bg-background text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand cursor-pointer"
          >
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GeneralSettingsClient({ projectId, userId, settings, regionLabel }: Props) {
  const [name, setName] = React.useState(settings.name);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  const handleSaveName = async (newName: string) => {
    setSaveError(null);
    const res = await fetch(`/api/internal/settings?projectId=${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setSaveError(j?.error ?? "Failed to save");
      return;
    }
    setName(newName);
  };

  const createdAt = settings.created_at
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(settings.created_at))
    : "—";

  return (
    <div>
      {saveError && (
        <div className="mb-4 rounded-lg bg-danger-bg border border-danger/20 px-4 py-3 text-sm text-danger-text">
          {saveError}
        </div>
      )}

      {/* Your project */}
      <SectionCard title="Your project">
        <InfoRow
          label="Project name"
          value={name}
          editable
          copyable
          onSave={handleSaveName}
        />
        <InfoRow
          label="Project ID"
          value={settings.id}
          copyable
          mono
        />
        <InfoRow
          label="Organization"
          value={settings.org_name}
        />
        <InfoRow
          label="Plan"
          value={settings.org_plan.charAt(0).toUpperCase() + settings.org_plan.slice(1)}
        />
        <InfoRow
          label="Created"
          value={createdAt}
        />
      </SectionCard>

      {/* Environment */}
      <SectionCard
        title="Environment"
        description="This setting customizes your project for different stages of the app lifecycle"
      >
        <EnvTypeRow projectId={projectId} />
      </SectionCard>

      {/* Public settings */}
      <SectionCard
        title="Public settings"
        description="Settings visible to end users of your application"
      >
        <InfoRow
          label="Display name"
          value={name}
          editable
          onSave={handleSaveName}
        />
        <InfoRow
          label="Region"
          value={regionLabel}
        />
        <InfoRow
          label="Status"
          value={settings.status.charAt(0).toUpperCase() + settings.status.slice(1)}
        />
      </SectionCard>

      {/* Infrastructure */}
      <SectionCard
        title="Infrastructure"
        description="Internal resource identifiers — do not share publicly"
      >
        <InfoRow
          label="PostgreSQL schema"
          value={settings.db_schema}
          copyable
          mono
        />
        <InfoRow
          label="MongoDB database"
          value={settings.mongo_database}
          copyable
          mono
        />
      </SectionCard>

      {/* SDK snippet */}
      <SectionCard title="Quick connect">
        <div className="py-4">
          <p className="text-[12px] text-text-muted mb-3">
            Initialize the YourBaaS SDK with your project credentials
          </p>
          <div className="rounded-lg bg-[var(--code-bg)] border border-border p-4 font-mono text-[12px] text-text-secondary leading-relaxed overflow-x-auto whitespace-pre">
            <span className="text-brand">import</span>
            {` { BaasClient } `}
            <span className="text-brand">from</span>
            {` '@yourbaas/sdk'\n\n`}
            <span className="text-brand">const</span>
            {` baas = `}
            <span className="text-brand">new</span>
            {` BaasClient({\n`}
            {`  projectId: `}
            <span className="text-success-text">'{settings.id}'</span>
            {`,\n`}
            {`  apiKey: `}
            <span className="text-success-text">'sk_anon_...'</span>
            {`,\n})`}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}