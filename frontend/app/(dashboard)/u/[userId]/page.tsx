import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { Search } from "lucide-react";
import Link from "next/link";
import React from "react";

const Page = async () => {
  const session = await auth();
  const name = session?.user?.name ?? session?.user?.email ?? "User";

  return (
    <div className="p-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Welcome back, {name} 👋</h1>
        <p className="mt-1 text-lg text-[--text-secondary]">
          Manage your projects, API keys, and workspace settings from here.
        </p>
      </header>

      <section className="mb-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold">Quick Actions</h2>
            <p className="text-sm text-[--text-muted] mt-1">
              Get started or continue where you left off.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/projects">
              <Button>Create project</Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 max-w-xl">
          <Card className="bg-white">
            <CardContent>
              <div className="text-lg font-medium">Create a new project</div>
              <p className="text-sm text-[--text-muted] mt-1">
                Add a project to begin building with the BaaS APIs.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <label htmlFor="project-search" className="sr-only">
            Search projects
          </label>
          <div className="flex items-center gap-2 p-2 w-full max-w-md border rounded-md">
            <Search className="text-[--text-muted]" />
            <Input
              id="project-search"
              placeholder="Search projects, collections, or files..."
              className="border-0 outline-none ring-0"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;
