// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/docs/layout.tsx
import React from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DocsNav } from "@/components/docs/DocsNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function DocsLayout({ children, params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { userId, projectId } = await params;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar */}
      <DocsNav  />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}