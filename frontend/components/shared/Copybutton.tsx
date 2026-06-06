// frontend/components/shared/CopyButton.tsx
"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: "sm" | "md";
}

export function CopyButton({ value, className, size = "md" }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center justify-center rounded-[6px] border border-[--border] bg-[--surface] text-[--text-muted] transition-colors hover:border-[--border2] hover:text-[--text-primary]",
        sizeClasses[size],
        copied && "border-[--success-bg] text-[--success-text]",
        className,
      )}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}