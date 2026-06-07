// frontend/app/api/internal/realtime/data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function proxyRtdb(req: NextRequest, method: string) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const mongoDatabase = searchParams.get("mongo_database");

  if (!projectId || !mongoDatabase) {
    return NextResponse.json(
      { error: "Missing projectId or mongo_database" },
      { status: 400 }
    );
  }

  const upstreamParams = new URLSearchParams({ mongo_database: mongoDatabase });

  let upstreamUrl: string;
  let fetchInit: RequestInit;

  if (method === "GET") {
    const path = searchParams.get("path") ?? "/";
    upstreamParams.set("path", path);
    upstreamUrl = `${FASTAPI_BASE_URL}/internal/projects/${projectId}/rtdb/data?${upstreamParams}`;
    fetchInit = { method: "GET", headers: { "x-internal-secret": INTERNAL_SECRET }, cache: "no-store" };
  } else if (method === "PUT") {
    upstreamUrl = `${FASTAPI_BASE_URL}/internal/projects/${projectId}/rtdb/data?${upstreamParams}`;
    const body = await req.text();
    fetchInit = {
      method: "PUT",
      headers: { "x-internal-secret": INTERNAL_SECRET, "Content-Type": "application/json" },
      body,
      cache: "no-store",
    };
  } else {
    // DELETE
    const path = searchParams.get("path") ?? "/";
    upstreamParams.set("path", path);
    upstreamUrl = `${FASTAPI_BASE_URL}/internal/projects/${projectId}/rtdb/data?${upstreamParams}`;
    fetchInit = { method: "DELETE", headers: { "x-internal-secret": INTERNAL_SECRET }, cache: "no-store" };
  }

  try {
    const res = await fetch(upstreamUrl, fetchInit);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}

export async function GET(req: NextRequest) { return proxyRtdb(req, "GET"); }
export async function PUT(req: NextRequest) { return proxyRtdb(req, "PUT"); }
export async function DELETE(req: NextRequest) { return proxyRtdb(req, "DELETE"); }