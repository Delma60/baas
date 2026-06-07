// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/realtime/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
import {
  getRealtimeChannels,
  getRealtimeStats,
  getRealtimeRules,
} from "@/lib/api/realtime-client";
import { getRtdbData, getRtdbStats } from "@/lib/api/realtime-data-client";
import { RealtimePageClient } from "@/components/realtime/RealtimePageClient";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `Realtime · ${projectId}` };
}

export default async function RealtimePage({ params }: Props) {
  const { projectId } = await params;

  // Get project to get mongoDatabase
  let mongoDatabase = "";
  try {
    const project = await getProjectById(projectId);
    mongoDatabase = (project as any).mongo_database ?? "";
  } catch {
    // fallback — page will show empty state
  }

  // Fetch all data in parallel; fall back gracefully if tables not yet migrated
  const [channels, stats, rules, rtdbData] = await Promise.all([
    getRealtimeChannels(projectId).catch(() => []),
    getRealtimeStats(projectId).catch(() => ({
      total_channels: 0,
      active_channels: 0,
      presence_channels: 0,
      connected_clients: 0,
    })),
    getRealtimeRules(projectId).catch(() => ({
      rules_json: `{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}`,
      updated_at: null,
    })),
    mongoDatabase
      ? getRtdbData(projectId, mongoDatabase, "/").catch(() => ({ tree: {}, path: "/", count: 0 }))
      : Promise.resolve({ tree: {}, path: "/", count: 0 }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const dbUrl = `${appUrl}/realtime/${projectId}`;

  return (
    <RealtimePageClient
      projectId={projectId}
      mongoDatabase={mongoDatabase}
      initialChannels={channels}
      initialStats={stats}
      initialRules={rules.rules_json}
      initialTree={rtdbData.tree}
      dbUrl={dbUrl}
    />
  );
}