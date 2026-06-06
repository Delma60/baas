// frontend/components/shared/ApiKeyDisplay.tsx
"use client";

import * as React from "react";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/shared/Copybutton";

interface ApiKeyDisplayProps {
  label: string;
  keyValue: string;
  type: "anon" | "service";
  className?: string;
}

export function ApiKeyDisplay({ label, keyValue, type, className }: ApiKeyDisplayProps) {
  const [revealed, setRevealed] = React.useState(type === "anon");

  const masked = keyValue.slice(0, 14) + "•".repeat(20) + keyValue.slice(-4);

  return (
    <div
      className={cn(
        "rounded-xl border border-[--border] bg-[--background] p-4",
        type === "service" && "border-yellow-200/50 dark:border-yellow-900/30",
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-[--text-secondary]">{label}</span>
        <div className="flex items-center gap-1">
          {type === "service" && (
            <AlertTriangle className="h-3 w-3 text-yellow-500" />
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              type === "anon"
                ? "bg-[--info-bg] text-[--info-text]"
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            )}
          >
            {type === "anon" ? "Public" : "Secret"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[--border] bg-[--surface] px-3 py-2">
        <code className="flex-1 truncate font-mono text-xs text-[--text-primary]">
          {revealed ? keyValue : masked}
        </code>
        <button
          onClick={() => setRevealed(!revealed)}
          className="flex-shrink-0 text-[--text-muted] transition-colors hover:text-[--text-primary]"
          aria-label={revealed ? "Hide key" : "Show key"}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <CopyButton value={keyValue} size="sm" />
      </div>

      {type === "service" && (
        <p className="mt-2 text-[11px] text-yellow-600 dark:text-yellow-400">
          Never expose this key in client-side code or public repos.
        </p>
      )}
    </div>
  );
}