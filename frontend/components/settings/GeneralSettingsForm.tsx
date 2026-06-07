// frontend/components/settings/GeneralSettingsForm.tsx
"use client";

import * as React from "react";
import { Copy, Check, Globe, Database, Server, RefreshCw } from "lucide-react";
import type { Project } from "@/types/baas";
import { cn } from "@/lib/utils";

const REGION_LABELS: Record<string, string> = {
  lagos: "Lagos, Nigeria (af-south-1)",
  london: "London, UK (eu-west-2)",
  singapore: "Singapore (ap-southeast-1)",
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-text-secondary mb-0.5">{label}</p>
        <p className="text-[14px] font-mono text-text-primary truncate pr-4">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 shrink-0 text-[12px] text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded hover:bg-surface"
      >
        {copied ? (
          <><Check className="h-3.5 w-3.5 text-success" /><span className="text-success">Copied</span></>
        ) : (
          <><Copy className="h-3.5 w-3.5" /><span>Copy</span></>
        )}
      </button>
    </div>
  );
}

function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-border bg-background">
        <p className="text-[13px] font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="text-[12px] text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

interface Props {
  project: Project;
  userId: string;
}

export function GeneralSettingsForm({ project, userId }: Props) {
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState(project.name);
  const [saved, setSaved] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    // TODO: wire to PATCH /internal/projects/{id} when that endpoint exists
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      {/* Your project */}
      <SectionCard
        title="Your project"
        description="Core identifiers for this project"
      >
        <CopyField label="Project name" value={project.name} />
        <CopyField label="Project ID" value={project.id} />
        <CopyField label="Region" value={REGION_LABELS[project.region] ?? project.region} />
        <CopyField label="Status" value={project.status} />
      </SectionCard>

      {/* Environment */}
      <SectionCard
        title="Environment"
        description="This setting customizes your project for different stages of the app lifecycle"
      >
        <div className="py-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] text-text-secondary mb-0.5">Environment type</p>
            <p className="text-[14px] text-text-primary">Production</p>
          </div>
        </div>
      </SectionCard>

      {/* Infrastructure */}
      <SectionCard
        title="Infrastructure"
        description="Internal resource identifiers for your project's databases"
      >
        <CopyField label="PostgreSQL schema" value={project.db_schema} />
        <CopyField label="MongoDB database" value={project.mongo_database} />
      </SectionCard>

      {/* Public settings */}
      <SectionCard
        title="Public settings"
        description="These settings control how your project appears to end users"
      >
        <div className="py-4">
          <label className="block text-[13px] text-text-secondary mb-2">
            Display name
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
            />
            <button
              onClick={handleSave}
              disabled={saving || name === project.name}
              className={cn(
                "h-9 px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                saving || name === project.name
                  ? "bg-surface text-text-muted cursor-not-allowed border border-border"
                  : "bg-brand hover:bg-brand-hover text-white"
              )}
            >
              {saving ? (
                <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving…</>
              ) : saved ? (
                <><Check className="h-3.5 w-3.5" /> Saved</>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* SDK snippet */}
      <SectionCard title="Quick connect">
        <div className="py-4">
          <p className="text-[12px] text-text-muted mb-3">Initialize the SDK with your project</p>
          <div className="rounded-lg bg-[var(--code-bg)] border border-border p-4 font-mono text-[12px] text-text-secondary leading-relaxed overflow-x-auto">
            <span className="text-brand">import</span>
            {` { BaasClient } `}
            <span className="text-brand">from</span>
            {` '@yourbaas/sdk'\n\n`}
            <span className="text-text-muted">{"// Initialize the client"}</span>
            {`\n`}
            <span className="text-brand">const</span>
            {` baas = `}
            <span className="text-brand">new</span>
            {` BaasClient({\n`}
            {`  projectId: `}
            <span className="text-success">'{project.id}'</span>
            {`,\n`}
            {`  apiKey: `}
            <span className="text-success">'sk_anon_...'</span>
            {`,\n})`}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}