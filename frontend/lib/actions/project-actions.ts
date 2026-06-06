// frontend/lib/actions/project-actions.ts
"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createProject } from "@/lib/api/client";
import { revalidatePath } from "next/cache";

const CreateProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(40, "Name must be under 40 characters")
    .regex(
      /^[a-zA-Z0-9\s-]+[a-zA-Z0-9]$/,
      "Use letters, numbers, spaces, and hyphens"
    ),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(40, "Slug must be under 40 characters")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Slug must use lowercase letters, numbers, and hyphens only"
    ),
  region: z.enum(["lagos", "london", "singapore"]),
  description: z.string().max(200).optional(),
});

export type CreateProjectState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function createProjectAction(
  _prev: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const raw = {
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase(),
    region: formData.get("region") as string,
    description: formData.get("description") as string | undefined,
  };

  const parsed = CreateProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const projectId = `proj_${parsed.data.slug}`;
  const dbSchema = `proj_${generateId()}`;
  const mongoDatabase = `proj_${generateId()}`;

  try {
    await createProject({
      project_id: projectId,
      name: parsed.data.name,
      region: parsed.data.region,
      db_schema: dbSchema,
      mongo_database: mongoDatabase,
    });
  } catch (err: any) {
    if (err?.status === 409) {
      return { errors: { slug: ["A project with this slug already exists"] } };
    }
    if (err?.status === 503) {
      return { message: "Cannot reach the backend. Please try again." };
    }
    return { message: err?.message ?? "Something went wrong. Please try again." };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${projectId}`);
}