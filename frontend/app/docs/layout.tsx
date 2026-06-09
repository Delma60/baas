// frontend/app/docs/layout.tsx
import React from "react";
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

  return (
    <div className="flex h-full overflow-hidden">
        
      <DocsNav />

      {/* Main content — add top padding on mobile for the fixed header */}
      <main className="flex-1 overflow-y-auto bg-background pt-12 md:pt-0">
        {children}
      </main>
    </div>
  );
}