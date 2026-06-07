// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/settings/layout.tsx
import React from "react";
import Link from "next/link";
import { Settings } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { SettingsTab } from "@/components/settings/SettingsTab";

const TABS = [
  { label: "General", href: "settings" },
  { label: "API Keys", href: "settings/api-keys" },
  { label: "Members", href: "settings/members" },
  { label: "Billing", href: "settings/billing" },
  { label: "Danger Zone", href: "settings/danger" },
];

interface Props {
  children: React.ReactNode;
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function SettingsLayout({ children, params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userId, projectId } = await params;

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-6 py-5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand/10">
          <Settings className="h-4 w-4 text-brand" />
        </div>
        <div>
          <h1 className="text-base font-medium text-text-primary">Project settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage your project configuration and access
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-background shrink-0 px-6">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => {
            const href = `/u/${userId}/projects/${projectId}/${tab.href}`;
            return (
              <SettingsTab key={tab.href} href={href} label={tab.label} danger={tab.href === "settings/danger"} />
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
