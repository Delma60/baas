// frontend/app/(dashboard)/u/[userId]/page.tsx
import Link from "next/link";
import {
  Flame,
  Database,
  Layers,
  HardDrive,
  ShieldCheck,
  Radio,
  Zap,
} from "lucide-react";
import type { Project } from "@/types/baas";
import { ProjectList } from "@/components/dashboard/ProjectList";
import { getProjects, getProjectsByUser } from "@/lib/api/client";
import { auth } from "@/lib/auth";
import { AvatarComp } from "@/components/shared/AvatarComp";
import { User } from "next-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ userId: string }>;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SAMPLE_FEATURES = [
  {
    title: "SQL Database",
    description:
      "Build scalable relational applications with PostgreSQL. Use powerful queries, full-text search, and vector embeddings for AI workloads.",
    icon: Database,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "NoSQL & Key-Value Store",
    description:
      "Store flexible document data with MongoDB, or use Redis-like key-value operations for real-time features and caching.",
    icon: Layers,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Cloud Storage",
    description:
      "Upload and manage files with MinIO object storage. Generate presigned URLs for secure, direct uploads and downloads.",
    icon: HardDrive,
    color: "from-purple-500 to-violet-500",
  },
  {
    title: "Authentication & Permissions",
    description:
      "Secure your app with multi-tenant auth, role-based access control (RBAC), and row-level security policies. Zero configuration.",
    icon: ShieldCheck,
    color: "from-red-500 to-orange-500",
  },
  {
    title: "Realtime Subscriptions",
    description:
      "Listen to database changes in real-time via PostgreSQL LISTEN/NOTIFY and MongoDB Change Streams. No polling required.",
    icon: Radio,
    color: "from-pink-500 to-rose-500",
  },
  {
    title: "Edge Functions",
    description:
      "Deploy serverless functions that scale instantly. Trigger on HTTP requests, database events, or schedules.",
    icon: Zap,
    color: "from-yellow-500 to-amber-500",
  },
];

// ─── Page (server component) ──────────────────────────────────────────────────

export default async function ProjectsDashboard({ params }: PageProps) {
  const session = await auth();

  // TODO: pull from session / DB
  const userName = session?.user?.name;
  const userId = session?.user?.id as string;

  // Fetch real projects from backend
  let projects: Project[] = [];
  try {
    projects = await getProjectsByUser(userId);
    // projects = await getProjects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="flex justify-between items-center">
          <div className="h-14 flex items-center px-4 md:px-6 gap-2">
            <Flame className="w-6 h-6 text-brand" />
            <span className="text-[15px] font-medium text-[#202124]">
              YourBaaS
            </span>
          </div>
          <AvatarComp user={session?.user as User} />
        </header>

        <main className="px-6 md:px-10 pb-20 max-w-[1100px] mx-auto w-full">
          {/* Greeting */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-[40px] font-normal text-brand leading-tight mb-1">
              Hello, {userName}
            </h1>
            <p className="text-[#3c4043] text-lg md:text-[18px] font-normal">
              Welcome back to YourBaaS!
            </p>
          </div>

          {/* Two-col layout (stack on small screens) */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
            {/* Left: get started + sample apps */}
            <div className="flex-1 min-w-0 lg:max-w-[540px]">
              <div className="">
                <p className="text-[13px] font-medium text-[#5f6368] mb-3">
                  Get started
                </p>
                <Link href={`/u/${userId}/projects/new`}>
                  <div className="bg-white rounded-lg border border-[#e8eaed] p-4 md:p-5 flex items-start gap-4 hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] transition-shadow cursor-pointer mb-6">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm md:text-[14px] font-semibold text-[#202124] mb-0.5">
                        Create a new project
                      </p>
                      <p className="text-xs md:text-[13px] text-[#5f6368] leading-relaxed">
                        Integrate YourBaaS products to super-charge your app
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="flex-1 min-w-0 block md:hidden">
                <ProjectList projects={projects} userId={userId} />
              </div>
              <div className="">
                <p className="text-[13px] font-medium text-[#5f6368] mb-3">
                  Try out a sample app
                </p>
                <div className="flex flex-col gap-3">
                  {SAMPLE_FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <div
                        key={feature.title}
                        className="bg-white rounded-lg border border-[#e8eaed] p-4 md:p-5 flex items-start gap-4 hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] transition-shadow cursor-pointer"
                      >
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 relative`}
                        >
                          <Icon className="w-5 h-5 text-white" />
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[8px] font-bold">
                              ✦
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm md:text-[14px] font-semibold text-[#202124] mb-1">
                            {feature.title}
                          </p>
                          <p className="text-xs md:text-[13px] text-[#5f6368] leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: interactive project list (client component) */}
            <div className="flex-1 min-w-0 hidden md:block">
              <ProjectList projects={projects} userId={userId} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
