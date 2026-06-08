// frontend/components/settings/SettingsTabNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  href: string;
  danger?: boolean;
}

interface Props {
  tabs: Tab[];
}

export function SettingsTab({ tabs }: Props) {
  const pathname = usePathname();

  function isActive(tab: Tab) {
    // Exact match for General (root settings), prefix match for others
    if (tab.href === pathname) return true;
    // For non-general tabs, check if pathname starts with href
    if (!pathname.endsWith("/settings") && pathname.startsWith(tab.href) && tab.href !== tabs[0].href) {
      return true;
    }
    return false;
  }

  return (
    <nav className="flex gap-0 -mb-px overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const active = isActive(tab);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0",
              active
                ? tab.danger
                  ? "border-danger text-danger"
                  : "border-brand text-brand"
                : tab.danger
                  ? "border-transparent text-danger-text/60 hover:text-danger-text hover:border-danger/40"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border2",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}