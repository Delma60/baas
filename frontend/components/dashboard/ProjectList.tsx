// frontend/components/dashboard/ProjectList.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Star, ChevronDown, Droplets } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface ProjectListProps {
  projects: Project[];
  userId: string;
}

export function ProjectList({ projects, userId }: ProjectListProps) {
  const [search, setSearch] = useState("");
  const [starred, setStarred] = useState<Set<string>>(new Set());

  const filtered = projects.filter(
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
    <div className=" flex-shrink-0">
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
                idx < filtered.length - 1 ? "border-b border-[#f1f3f4]" : ""
              }`}
            >
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
                aria-label={`Star ${project.name}`}
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
  );
}