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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon?: React.ElementType;
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
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
        // { href: `${base}/nosql`, label: "NoSQL / Documents", icon: Layers },
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
        { href: `${base}/api-reference`, label: "REST API Reference", icon: Terminal },
        { href: `${base}/sdk`, label: "SDK Reference", icon: Code2 },
      ],
    },
  ];

  return (
    <nav className="flex flex-col gap-6 py-6 px-3 h-full overflow-y-auto">
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
                  onClick={onNavigate}
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

export function DocsNav() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  // Close mobile nav on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile trigger — shown in the docs layout header area */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 h-12">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center h-8 w-8 rounded-lg text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
          aria-label="Open docs navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-text-primary">Docs</span>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-background" showCloseButton={false}>
          <SheetHeader className="sr-only">
            <SheetTitle>Documentation Navigation</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-between px-4 h-12 border-b border-border">
            <span className="text-sm font-semibold text-text-primary">Docs</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center h-7 w-7 rounded-lg text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <NavContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0 border-r border-border bg-background h-full overflow-y-auto">
        <NavContent />
      </aside>
    </>
  );
}