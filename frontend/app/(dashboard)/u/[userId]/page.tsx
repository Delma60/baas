// frontend/app/(dashboard)/u/[userId]/page.tsx
import Link from "next/link";
import {
  Flame,
  Plus,
  ArrowRight,
  Database,
  Layers,
  HardDrive,
  ShieldCheck,
  Radio,
  Zap,
  Activity,
  TrendingUp,
  Users,
  Server,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjectsByUser } from "@/lib/api/client";
import { AvatarComp } from "@/components/shared/AvatarComp";
import { User } from "next-auth";
import type { Project } from "@/types/baas";
import { ProjectList } from "@/components/dashboard/ProjectList";
import { APP_NAME } from "@/lib/utils/constants";

interface PageProps {
  params: Promise<{ userId: string }>;
}

const MODULES = [
  {
    title: "SQL Database",
    description:
      "Relational tables, full-text search, and pgvector embeddings for AI workloads.",
    icon: Database,
    href: "database",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "NoSQL & Key-Value",
    description:
      "Flexible documents with MongoDB, plus Redis-like KV operations for caching.",
    icon: Layers,
    href: "nosql",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    title: "Cloud Storage",
    description:
      "Upload and serve files with presigned URLs for secure direct access.",
    icon: HardDrive,
    href: "storage",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "Authentication",
    description:
      "Multi-tenant auth with RBAC and row-level security. Zero configuration.",
    icon: ShieldCheck,
    href: "auth",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Realtime Events",
    description:
      "Listen to database changes via PostgreSQL LISTEN/NOTIFY. No polling.",
    icon: Radio,
    href: "realtime",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    title: "Edge Functions",
    description:
      "Deploy serverless functions triggered by HTTP requests or schedules.",
    icon: Zap,
    href: "functions",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

function ProjectStatusBadge({ status }: { status: Project["status"] }) {
  const styles = {
    active:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    paused:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    deleted: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-emerald-500" : "bg-amber-500"}`}
      />
      {status}
    </span>
  );
}

function EmptyProjectsState({ userId }: { userId: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#dadce0] bg-white py-16 px-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
        <Server className="h-6 w-6 text-brand" />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-[#202124]">
          No projects yet
        </p>
        <p className="mt-1 text-[13px] text-[#5f6368]">
          Create your first project to start building with {APP_NAME}
        </p>
      </div>
      <Link
        href={`/u/${userId}/projects/new`}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-hover transition-colors"
      >
        <Plus className="h-4 w-4" />
        Create project
      </Link>
    </div>
  );
}

function ProjectCard({
  project,
  userId,
}: {
  project: Project;
  userId: string;
}) {
  return (
    <Link href={`/u/${userId}/projects/${project.id}/overview`}>
      <div className="group flex items-center gap-4 rounded-xl border border-[#e8eaed] bg-white p-4 hover:shadow-[0_1px_6px_rgba(32,33,36,0.18)] hover:border-[#dadce0] transition-all cursor-pointer">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-orange-600 flex-shrink-0 shadow-sm">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#202124] truncate">
            {project.name}
          </p>
          <p className="text-[12px] text-[#5f6368] truncate mt-0.5">
            {project.id}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <ProjectStatusBadge status={project.status} />
          <ArrowRight className="h-4 w-4 text-[#bdc1c6] transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

export default async function ProjectsDashboard({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const userName =
    session.user.name ?? session.user.email?.split("@")[0] ?? "there";

  let projects: Project[] = [];
  try {
    projects = await getProjectsByUser(userId);
  } catch (err) {
    console.error("[Dashboard] Failed to fetch projects:", err);
  }

  const activeCount = projects.filter((p) => p.status === "active").length;
  const pausedCount = projects.filter((p) => p.status === "paused").length;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-[#e8eaed] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-brand" />
            <span className="text-[15px] font-semibold text-[#202124]">
              {APP_NAME}
            </span>
          </div>
          <AvatarComp user={session.user as User} />
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-normal text-[#202124] md:text-[36px] leading-tight">
            Welcome back, <span className="text-brand">{userName}</span>
          </h1>
          <p className="mt-1 text-[#5f6368] text-[16px]">
            {projects.length > 0
              ? `You have ${activeCount} active project${activeCount !== 1 ? "s" : ""}${pausedCount > 0 ? ` and ${pausedCount} paused` : ""}.`
              : "Get started by creating your first project."}
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Quick actions */}
            <div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#5f6368]">
                Quick actions
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link href={`/u/${userId}/projects/new`}>
                  <div className="flex items-start gap-4 rounded-xl border border-[#e8eaed] bg-white p-4 hover:shadow-[0_1px_6px_rgba(32,33,36,0.18)] transition-all cursor-pointer group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 flex-shrink-0">
                      <Plus className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#202124]">
                        New project
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#5f6368]">
                        Set up a full backend in seconds
                      </p>
                    </div>
                  </div>
                </Link>
                <Link href="https://docs.yourbaas.com" target="_blank">
                  <div className="flex items-start gap-4 rounded-xl border border-[#e8eaed] bg-white p-4 hover:shadow-[0_1px_6px_rgba(32,33,36,0.18)] transition-all cursor-pointer group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-bg flex-shrink-0">
                      <Activity className="h-5 w-5 text-info-text" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#202124]">
                        Documentation
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#5f6368]">
                        SDKs, guides, and API reference
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Feature modules */}
            <div>
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#5f6368]">
                Platform features
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MODULES.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={mod.title}
                      className="flex items-start gap-3 rounded-xl border border-[#e8eaed] bg-white p-4"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 mt-0.5 ${mod.bg}`}
                      >
                        <Icon className={`h-4.5 w-4.5 ${mod.color}`} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[#202124]">
                          {mod.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#5f6368] leading-relaxed">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column — projects */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="sticky top-24">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[#5f6368]">
                  Your projects ({projects.length})
                </p>
                {projects.length > 0 && (
                  <Link
                    href={`/u/${userId}/projects/new`}
                    className="flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New
                  </Link>
                )}
              </div>

              {projects.length === 0 ? (
                <EmptyProjectsState userId={userId} />
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      userId={userId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
