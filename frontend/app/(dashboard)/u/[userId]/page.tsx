// frontend/app/(dashboard)/u/[userId]/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Search,
  Star,
  ChevronDown,
  Flame,
  Droplets,
  Terminal,
  Moon,
  HelpCircle,
  BookOpen,
  Sparkles,
  Smartphone,
  MapPin,
  Bell,
} from "lucide-react";

const MOCK_PROJECTS = [
  { id: "ajo-app-929ee", name: "ajo-app" },
  { id: "hosting-platform-daa51", name: "hosting-platform" },
  { id: "ai-project-ef820", name: "ai-project" },
  { id: "neon-347b0", name: "Neon" },
  { id: "spaclit-3f2a1", name: "spaclit" },
  { id: "dormancy-guard-9b1c", name: "dormancy-guard" },
];

const SAMPLE_APPS = [
  {
    title: "Build an AI-powered Flutter app",
    description:
      "Deploy a sample app that showcases how the Gemini Live API, multimodal prompts, and image creation all work in Flutter",
    icon: Sparkles,
  },
  {
    title: "Try an AI-powered trip planner app",
    description:
      "Deploy a sample app that uses Firestore, Authentication, and multimodal input using AI Logic. Explore the app in the Studio",
    icon: MapPin,
  },
  {
    title: "Build a mobile app with Flutter",
    description:
      "Get hands-on with a complete Flutter app connected to YourBaaS services including auth, database, and storage",
    icon: Smartphone,
  },
];

const RIGHT_NAV = [
  { icon: Bell, label: "Notifications" },
  { icon: Sparkles, label: "AI Assistant", active: true },
  { icon: HelpCircle, label: "Help" },
  { icon: Terminal, label: "Console" },
  { icon: BookOpen, label: "Docs" },
  { icon: Moon, label: "Dark mode" },
];

export default function ProjectsDashboard({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = params;
  const userName = "Olaniyi";
  const [search, setSearch] = useState("");
  const [starred, setStarred] = useState<Set<string>>(new Set());

  const filtered = MOCK_PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="h-14 flex items-center px-6 gap-2">
          <Flame className="w-6 h-6 text-[--brand]" />
          <span className="text-[15px] font-medium text-[#202124]">YourBaaS</span>
        </header>

        <main className="px-10 pb-20 max-w-[1100px]">
          {/* Greeting */}
          <div className="mb-10">
            <h1 className="text-[40px] font-normal text-[--brand] leading-tight mb-1">
              Hello, {userName}
            </h1>
            <p className="text-[#3c4043] text-[18px] font-normal">
              Welcome back to YourBaaS!
            </p>
          </div>

          {/* Two-col layout */}
          <div className="flex gap-12">
            {/* Left: get started + sample apps */}
            <div className="flex-1 min-w-0 max-w-[540px]">
              <p className="text-[13px] font-medium text-[#5f6368] mb-3">
                Get started
              </p>
              <Link href={`/u/${userId}/projects/new`}>
                <div className="bg-white rounded-lg border border-[#e8eaed] p-5 flex items-start gap-4 hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] transition-shadow cursor-pointer mb-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#202124] mb-0.5">
                      Create a new project
                    </p>
                    <p className="text-[13px] text-[#5f6368] leading-relaxed">
                      Integrate YourBaaS products to super-charge your app
                    </p>
                  </div>
                </div>
              </Link>

              <p className="text-[13px] font-medium text-[#5f6368] mb-3">
                Try out a sample app
              </p>
              <div className="flex flex-col gap-3">
                {SAMPLE_APPS.map((app) => {
                  const Icon = app.icon;
                  return (
                    <div
                      key={app.title}
                      className="bg-white rounded-lg border border-[#e8eaed] p-5 flex items-start gap-4 hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)] transition-shadow cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 relative">
                        <Icon className="w-5 h-5 text-white" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-[8px] font-bold">✦</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#202124] mb-1">
                          {app.title}
                        </p>
                        <p className="text-[13px] text-[#5f6368] leading-relaxed">
                          {app.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: project list */}
            <div className="w-[400px] flex-shrink-0">
              {/* Search */}
              <div className="relative mb-5">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#5f6368]" />
                <input
                  type="text"
                  placeholder="Search all projects and workspaces"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-transparent border-0 border-b border-[#dadce0] text-[14px] text-[#202124] placeholder:text-[#5f6368] focus:outline-none focus:border-[#1a73e8] transition-colors"
                />
              </div>

              {/* Filter pill */}
              <div className="mb-4">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#dadce0] text-[13px] text-[#3c4043] hover:bg-[#f1f3f4] transition-colors">
                  Projects and workspaces
                  <ChevronDown className="w-4 h-4 text-[#5f6368]" />
                </button>
              </div>

              {/* List */}
              <div className="bg-white rounded-lg border border-[#e8eaed] overflow-hidden">
                {filtered.map((project, idx) => (
                  <Link key={project.id} href={`/u/${userId}/projects/${project.id}`}>
                    <div
                      className={`flex items-center gap-3 px-5 py-4 hover:bg-[#f8f9fa] transition-colors cursor-pointer group ${
                        idx < filtered.length - 1
                          ? "border-b border-[#f1f3f4]"
                          : ""
                      }`}
                    >
                      {/* Droplet icon — matches Firebase style */}
                      <Droplets className="w-6 h-6 text-[#bdc1c6] flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-[#1a73e8] truncate hover:underline">
                          {project.name}
                        </p>
                        <p className="text-[12px] text-[#5f6368] truncate mt-0.5">
                          {project.id}
                        </p>
                      </div>

                      <button
                        onClick={(e) => toggleStar(project.id, e)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f3f4] transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            starred.has(project.id)
                              ? "fill-amber-400 text-amber-400"
                              : "text-[#5f6368]"
                          }`}
                        />
                      </button>
                    </div>
                  </Link>
                ))}

                {filtered.length === 0 && (
                  <p className="px-5 py-10 text-center text-[#5f6368] text-[13px]">
                    No projects match your search
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Right sidebar (icon strip) ── */}
      <div className="w-14 flex-shrink-0 border-l border-[#e8eaed] bg-[#f8f9fa] flex flex-col items-center py-3 gap-1">
        {/* User avatar */}
        <button className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-white text-sm font-medium mb-3">
          O
        </button>

        {RIGHT_NAV.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            title={label}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              active
                ? "bg-blue-100 text-[#1a73e8]"
                : "text-[#5f6368] hover:bg-[#e8eaed]"
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>
    </div>
  );
}