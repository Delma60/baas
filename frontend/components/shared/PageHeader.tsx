// frontend/components/shared/PageHeader.tsx
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: "orange" | "blue" | "green" | "purple";
  actions?: React.ReactNode;
  className?: string;
}

const ICON_COLORS = {
  orange: "bg-brand/10 text-[--brand]",
  blue: "bg-[--info-bg] text-[--info-text]",
  green: "bg-[--success-bg] text-[--success-text]",
  purple: "bg-[#7F77DD]/10 text-[#7F77DD]",
};

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = "orange",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-[--border] px-6 py-5",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]",
              ICON_COLORS[iconColor],
            )}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        <div>
          <h1 className="text-base font-medium text-[--text-primary]">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-sm text-[--text-secondary]">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
