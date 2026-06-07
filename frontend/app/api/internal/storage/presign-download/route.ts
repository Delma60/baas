// frontend/app/api/internal/storage/presign-download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, bucket, key, expiresIn = 3600 } = await req.json();

  if (!projectId || !bucket || !key) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({ file_key: key, expires_in: String(expiresIn) });
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/storage/${projectId}/${bucket}/presign-download?${params}`,
      {
        method: "POST",
        headers: { "x-internal-secret": INTERNAL_SECRET },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: body?.detail ?? "Failed to generate download URL" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ url: data.data?.url ?? data.url });
  } catch (err) {
    console.error("[storage presign download]", err);
    return NextResponse.json({ error: "Storage service unavailable" }, { status: 503 });
  }
}