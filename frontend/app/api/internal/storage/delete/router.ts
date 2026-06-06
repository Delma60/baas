// frontend/app/api/internal/storage/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, bucket, key } = await req.json();

  if (!projectId || !bucket || !key) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/storage/${projectId}/${bucket}/${encodeURIComponent(key)}`,
      {
        method: "DELETE",
        headers: {
          "x-internal-secret": INTERNAL_SECRET,
        },
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: body?.detail ?? "Delete failed" },
        { status: res.status }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[storage delete]", err);
    return NextResponse.json({ error: "Storage service unavailable" }, { status: 503 });
  }
}