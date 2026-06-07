// frontend/components/settings/SettingsTab.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SettingsTabProps {
  href: string;
  label: string;
  danger?: boolean;
}

export function SettingsTab({ href, label, danger }: SettingsTabProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href.endsWith("/settings") && pathname === href);

  return (
    <Link
      href={href}
      className={cn(
        "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        isActive
          ? danger
            ? "border-danger text-danger"
            : "border-brand text-brand"
          : danger
            ? "border-transparent text-danger-text/70 hover:text-danger-text hover:border-danger/40"
            : "border-transparent text-text-secondary hover:text-text-primary hover:border-border2",
      )}
    >
      {label}
    </Link>
  );
}