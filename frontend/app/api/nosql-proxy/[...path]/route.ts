// frontend/app/api/nosql-proxy/[...path]/route.ts
/**
 * Proxy route for NoSQL dashboard operations.
 * Forwards requests to FastAPI /internal/* with the internal secret header.
 * Only accessible from authenticated dashboard sessions.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, params, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, params, "POST");
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, params, "DELETE");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, params, "PUT");
}

async function proxy(
  req: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string
) {
  // Auth check — only authenticated users can use this proxy
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await paramsPromise;
  const pathStr = path.join("/");
  const searchParams = req.nextUrl.searchParams.toString();
  const url = `${FASTAPI_BASE_URL}/internal/${pathStr}${searchParams ? `?${searchParams}` : ""}`;

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
    },
    cache: "no-store",
  };

  if (method !== "GET" && method !== "DELETE") {
    try {
      const body = await req.text();
      if (body) (init as any).body = body;
    } catch {}
  }

  try {
    const upstream = await fetch(url, init);
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}