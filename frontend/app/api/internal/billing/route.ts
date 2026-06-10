// frontend/app/api/internal/billing/route.ts
/**
 * Next.js API proxy for billing operations.
 * All billing endpoints are scoped to a project_id (not orgId).
 * The backend resolves orgId internally from the projectId.
 */
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
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}

// GET /api/internal/billing?action=overview|plans|usage&projectId=xxx
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action");
  const projectId = searchParams.get("projectId");

  if (action === "plans") {
    return proxy("/billing/plans", { method: "GET" });
  }
  if (action === "usage" && projectId) {
    return proxy(`/billing/usage/${projectId}`, { method: "GET" });
  }
  if (action === "overview" && projectId) {
    return proxy(`/billing/${projectId}/overview`, { method: "GET" });
  }

  return NextResponse.json({ error: "Missing action or projectId" }, { status: 400 });
}

// POST /api/internal/billing — initiate checkout, verify, cancel
// Body must include `action` and `projectId`
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, projectId, ...rest } = body;

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  if (action === "initiate") {
    return proxy(`/billing/${projectId}/checkout/initiate`, {
      method: "POST",
      body: JSON.stringify(rest),
    });
  }
  if (action === "verify") {
    return proxy(`/billing/${projectId}/checkout/verify`, {
      method: "POST",
      body: JSON.stringify(rest),
    });
  }
  if (action === "cancel") {
    return proxy(`/billing/${projectId}/cancel`, { method: "POST" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}