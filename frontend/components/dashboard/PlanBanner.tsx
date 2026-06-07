// frontend/components/dashboard/PlanBanner.tsx
import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanBannerProps {
  currentPlan: string;
  className?: string;
}

export function PlanBanner({ currentPlan, className }: PlanBannerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-brand/20 bg-brand/10 px-4 py-3",
        className,
      )}
    >
      <Zap className="h-4 w-4 flex-shrink-0 text-brand" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[--text-primary]">
          You&apos;re on the {currentPlan} plan
        </p>
        <p className="text-xs text-[--text-secondary]">
          Upgrade to Starter to unlock 500K rows, 10 GB storage, and email
          support
        </p>
      </div>
      <Link
        href="/dashboard/billing"
        className="flex-shrink-0 rounded-[8px] border border-brand/30 bg-[--background] px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/5"
      >
        Upgrade →
      </Link>
    </div>
  );
}
