// frontend/app/api/internal/notifications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function proxy(path: string, init: RequestInit) {
  const res = await fetch(`${FASTAPI_BASE_URL}/internal${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/internal/notifications/[id]  → mark as read
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  return proxy(`/notifications/${id}/read?user_id=${session.user.id}`, { method: "PATCH" });
}

// DELETE /api/internal/notifications/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  return proxy(`/notifications/${id}?user_id=${session.user.id}`, { method: "DELETE" });
}