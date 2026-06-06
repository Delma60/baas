// frontend/app/(dashboard)/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PlanBanner } from "@/components/dashboard/PlanBanner";
// import { StatCards } from "@/components/dashboard/StatCards";
import { ProjectGrid } from "@/components/dashboard/ProjectGrid";
import { StatCards } from "@/components/dashboard/StatCards";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
// import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export const metadata: Metadata = { title: "Overview" };

// ─── Mock data (replace with real DB queries via lib/api/client.ts) ──────────

const MOCK_PROJECTS = [
  {
    id: "proj_store_api",
    name: "store-api",
    organizationName: "Acme Corp",
    status: "active" as const,
    region: "Lagos",
    icon: "cart",
    color: "orange" as const,
    modules: ["sql", "nosql", "auth", "storage", "realtime"] as const,
    sqlRows: 18_400,
    apiCalls: 12_300,
    updatedAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: "proj_mobile",
    name: "mobile-backend",
    organizationName: "Acme Corp",
    status: "active" as const,
    region: "Lagos",
    icon: "mobile",
    color: "blue" as const,
    modules: ["sql", "auth", "ai"] as const,
    sqlRows: 9_800,
    apiCalls: 7_100,
    updatedAt: new Date(Date.now() - 18 * 60 * 1000),
  },
  {
    id: "proj_cms",
    name: "cms-staging",
    organizationName: "Acme Corp",
    status: "paused" as const,
    region: "London",
    icon: "article",
    color: "purple" as const,
    modules: ["sql", "nosql", "storage"] as const,
    sqlRows: 10_000,
    apiCalls: 0,
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "proj_analytics",
    name: "analytics-svc",
    organizationName: "Acme Corp",
    status: "active" as const,
    region: "Lagos",
    icon: "chart",
    color: "green" as const,
    modules: ["sql", "ai", "functions"] as const,
    sqlRows: 31_000,
    apiCalls: 4_800,
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
];

const MOCK_STATS = {
  totalProjects: 4,
  activeProjects: 3,
  pausedProjects: 1,
  totalSqlRows: 38_200,
  sqlRowsChange: 12,
  storageUsedMb: 312,
  storageCapacityMb: 1024,
  apiCallsThisWeek: 24_100,
  apiCallsChange: 8,
};

const MOCK_ACTIVITY = [
  {
    id: "act_1",
    type: "auth" as const,
    icon: "user-plus",
    message: "New user signed up via **email/password**",
    projectName: "store-api",
    projectId: "proj_store_api",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: "act_2",
    type: "db" as const,
    icon: "table-plus",
    message: "Table **order_items** created with 6 columns",
    projectName: "store-api",
    projectId: "proj_store_api",
    timestamp: new Date(Date.now() - 18 * 60 * 1000),
  },
  {
    id: "act_3",
    type: "storage" as const,
    icon: "upload",
    message: "File **hero-banner.webp** uploaded to **assets** bucket",
    projectName: "mobile-backend",
    projectId: "proj_mobile",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: "act_4",
    type: "key" as const,
    icon: "key",
    message: "API key **sk_anon_…3f2c** generated",
    projectName: "mobile-backend",
    projectId: "proj_mobile",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "act_5",
    type: "ai" as const,
    icon: "sparkles",
    message: "Vector collection **product_embeddings** indexed — 1,240 vectors",
    projectName: "store-api",
    projectId: "proj_store_api",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

const MOCK_PLAN = {
  name: "free" as const,
  displayName: "Free",
};

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name ?? "there";
  const greeting = getGreeting(userName);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-medium text-[--text-primary]">{greeting}</h1>
        <p className="mt-1 text-sm text-[--text-secondary]">
          Here&apos;s what&apos;s happening across your projects.
        </p>
      </div>

      {/* Upgrade nudge — only on free plan */}
      {MOCK_PLAN.name === "free" && (
        <PlanBanner
          currentPlan={MOCK_PLAN.displayName}
          className="mb-6"
        />
      )}

      {/* Stats */}
      <StatCards stats={MOCK_STATS} className="mb-8" />

      {/* Projects + Activity side by side on wide viewports */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ProjectGrid projects={MOCK_PROJECTS} />
        <ActivityFeed activities={MOCK_ACTIVITY} />
      </div>
    </div>
  );
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const first = name.split(" ")[0];
  if (hour < 12) return `Good morning, ${first} 👋`;
  if (hour < 17) return `Good afternoon, ${first} 👋`;
  return `Good evening, ${first} 👋`;
}