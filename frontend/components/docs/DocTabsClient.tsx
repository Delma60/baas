// frontend/components/docs/DocTabsClient.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

interface Tab {
  label: string;
  lang: string;
  code: string;
}

export function DocTabsClient({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = React.useState(0);
  const [copied, setCopied] = React.useState(false);

  const current = tabs[active];
  if (!current) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-1">
        <div className="flex">
          {tabs.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActive(i)}
              className={cn(
                "px-4 py-2.5 text-[12px] font-medium transition-colors border-b-2",
                i === active
                  ? "border-brand text-text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "mr-2 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] transition-colors",
            copied
              ? "text-success-text"
              : "text-text-muted hover:text-text-primary hover:bg-surface",
          )}
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Code */}
      <pre className="bg-code-bg px-4 py-4 overflow-x-auto text-[13px] leading-relaxed">
        <code className="text-code-text font-mono whitespace-pre">{current.code}</code>
      </pre>
    </div>
  );
}