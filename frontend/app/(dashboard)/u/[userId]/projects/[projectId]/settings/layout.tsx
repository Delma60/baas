// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/settings/layout.tsx
import React from "react";
import { Settings } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsTab } from "@/components/settings/SettingsTab";

interface Props {
  children: React.ReactNode;
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function SettingsLayout({ children, params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userId, projectId } = await params;

  const TABS = [
    { label: "General", href: `/u/${userId}/projects/${projectId}/settings` },
    { label: "API Keys", href: `/u/${userId}/projects/${projectId}/settings/api-keys` },
    { label: "Members", href: `/u/${userId}/projects/${projectId}/settings/members` },
    { label: "Danger Zone", href: `/u/${userId}/projects/${projectId}/settings/danger`, danger: true },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="border-b border-border bg-background px-6 pt-6 shrink-0">
        <h1 className="text-2xl font-normal text-text-primary mb-4">Project settings</h1>
        {/* Tab Navigation */}
        <SettingsTab tabs={TABS} />
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