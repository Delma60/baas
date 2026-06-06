// frontend/components/shared/EmptyState.tsx
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[--border2] bg-[--surface] px-8 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[--background] border border-[--border]">
          <Icon className="h-5 w-5 text-[--text-muted]" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-[--text-primary]">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-[--text-muted]">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}