// frontend/components/settings/DangerZoneClient.tsx
"use client";

import * as React from "react";
import { AlertTriangle, Pause, Play, Trash2, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  userId: string;
  projectName: string;
  projectStatus: "active" | "paused" | "deleted";
  dbSchema: string;
  mongoDatabase: string;
}

function ConfirmModal({
  title,
  description,
  confirmText,
  confirmPlaceholder,
  danger,
  loading,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmText: string;
  confirmPlaceholder: string;
  danger?: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [input, setInput] = React.useState("");
  const matches = input === confirmText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              danger ? "bg-danger-bg" : "bg-warn-bg"
            )}>
              <AlertTriangle className={cn("h-4 w-4", danger ? "text-danger-text" : "text-warn-text")} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">{title}</h3>
              <p className="text-[13px] text-text-muted mt-0.5">{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors ml-2 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-[13px] text-text-secondary mb-2">
            Type <span className="font-mono font-semibold text-text-primary">{confirmText}</span> to confirm:
          </p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={confirmPlaceholder}
            autoFocus
            className="w-full h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-danger focus:border-danger transition-colors font-mono"
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!matches || loading}
              className={cn(
                "flex-1 h-9 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50",
                danger
                  ? "bg-danger hover:bg-danger/90 text-white"
                  : "bg-warn-text hover:bg-warn-text/90 text-white"
              )}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DangerCard({
  title,
  description,
  actionLabel,
  actionIcon: Icon,
  variant = "warning",
  onClick,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionIcon: React.ElementType;
  variant?: "warning" | "danger";
  onClick: () => void;
}) {
  return (
    <div className={cn(
      "rounded-xl border p-5 flex items-center justify-between gap-4",
      variant === "danger"
        ? "border-danger/30 bg-danger-bg/40"
        : "border-warn-text/20 bg-warn-bg/60"
    )}>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-text-primary">{title}</p>
        <p className="text-[12px] text-text-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 h-8 px-4 rounded-lg text-[13px] font-medium shrink-0 transition-colors border",
          variant === "danger"
            ? "border-danger/40 text-danger-text hover:bg-danger hover:text-white hover:border-danger"
            : "border-warn-text/30 text-warn-text hover:bg-warn-text hover:text-white hover:border-warn-text"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {actionLabel}
      </button>
    </div>
  );
}

export function DangerZoneClient({
  projectId,
  userId,
  projectName,
  projectStatus,
  dbSchema,
  mongoDatabase,
}: Props) {
  const router = useRouter();
  const [modal, setModal] = React.useState<"pause" | "resume" | "delete" | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isPaused = projectStatus === "paused";

  const handlePauseResume = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/internal/settings/status?projectId=${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isPaused ? "active" : "paused" }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? "Failed to update project status");
        return;
      }
      router.refresh();
      setModal(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/internal/settings/delete?projectId=${projectId}&db_schema=${dbSchema}&mongo_database=${mongoDatabase}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? "Failed to delete project");
        return;
      }
      router.push(`/u/${userId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {modal === "pause" && (
        <ConfirmModal
          title="Pause project"
          description="Pausing will disable all API access for this project. Your data is preserved."
          confirmText={projectName}
          confirmPlaceholder={`Type "${projectName}" to confirm`}
          variant="warning"
          loading={loading}
          onConfirm={handlePauseResume}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "resume" && (
        <ConfirmModal
          title="Resume project"
          description="Resuming will restore API access for this project immediately."
          confirmText={projectName}
          confirmPlaceholder={`Type "${projectName}" to confirm`}
          loading={loading}
          onConfirm={handlePauseResume}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "delete" && (
        <ConfirmModal
          title="Delete project"
          description="This is irreversible. All databases, storage files, and API keys will be permanently destroyed."
          confirmText={projectName}
          confirmPlaceholder={`Type "${projectName}" to confirm`}
          danger
          loading={loading}
          onConfirm={handleDelete}
          onClose={() => setModal(null)}
        />
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-danger-bg border border-danger/20 px-4 py-3 text-sm text-danger-text flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-xl border border-warn-text/20 bg-warn-bg px-4 py-3.5 mb-6">
        <AlertTriangle className="h-4 w-4 text-warn-text shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-warn-text leading-relaxed">
          Actions on this page can permanently affect your project and its data.
          Proceed with caution. Some operations cannot be undone.
        </p>
      </div>

      <div className="space-y-3">
        {isPaused ? (
          <DangerCard
            title="Resume project"
            description="Restore API access for all clients. Your project will go back to the active state."
            actionLabel="Resume project"
            actionIcon={Play}
            variant="warning"
            onClick={() => setModal("resume")}
          />
        ) : (
          <DangerCard
            title="Pause project"
            description="Temporarily disable all API access. Your data is preserved and the project can be resumed at any time."
            actionLabel="Pause project"
            actionIcon={Pause}
            variant="warning"
            onClick={() => setModal("pause")}
          />
        )}

        <DangerCard
          title="Delete project"
          description="Permanently delete this project and all associated resources — databases, storage, API keys, and configurations. This cannot be undone."
          actionLabel="Delete project"
          actionIcon={Trash2}
          variant="danger"
          onClick={() => setModal("delete")}
        />
      </div>
    </div>
  );
}