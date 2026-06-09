// frontend/components/docs/DocsNav.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Database,
  Layers,
  HardDrive,
  ShieldCheck,
  Radio,
  Zap,
  KeyRound,
  Terminal,
  Code2,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";


interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon?: React.ElementType;
}

export function DocsNav() {
  const pathname = usePathname();
  const base = `/docs`;

  const navGroups: NavGroup[] = [
    {
      label: "Getting Started",
      items: [
        { href: `${base}`, label: "Overview", icon: BookOpen },
        { href: `${base}/quickstart-js`, label: "JavaScript / TypeScript" },
        { href: `${base}/quickstart-python`, label: "Python" },
      ],
    },
    {
      label: "Modules",
      items: [
        { href: `${base}/sql`, label: "SQL Database", icon: Database },
        { href: `${base}/nosql`, label: "NoSQL / Documents", icon: Layers },
        { href: `${base}/kv`, label: "Key-Value Store", icon: KeyRound },
        { href: `${base}/storage`, label: "Storage", icon: HardDrive },
        { href: `${base}/auth`, label: "Authentication", icon: ShieldCheck },
        { href: `${base}/realtime`, label: "Realtime", icon: Radio },
        { href: `${base}/functions`, label: "Edge Functions", icon: Zap },
      ],
    },
    {
      label: "Reference",
      items: [
        {
          href: `${base}/api-reference`,
          label: "REST API Reference",
          icon: Terminal,
        },
        { href: `${base}/sdk`, label: "SDK Reference", icon: Code2 },
      ],
    },
  ];

  return (
    <nav className="w-56 shrink-0 border-r border-border bg-background overflow-y-auto py-6 px-3 flex flex-col gap-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== base && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 h-8 px-2.5 rounded-lg text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-active text-sidebar-active-text"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary",
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isActive ? "text-brand" : "text-sidebar-icon",
                      )}
                    />
                  )}
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
