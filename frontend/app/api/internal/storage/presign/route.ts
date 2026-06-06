// frontend/app/api/internal/storage/presign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  // Only authenticated users can upload
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, bucket, filename, contentType } = await req.json();

  if (!projectId || !bucket || !filename) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    // We need to call the FastAPI /v1/storage endpoint, but that requires an API key.
    // Instead, we have the internal endpoint generate the presigned URL directly.
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/storage/${projectId}/${bucket}/presign-upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": INTERNAL_SECRET,
        },
        body: JSON.stringify({ filename, content_type: contentType }),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: body?.detail ?? "Failed to get upload URL" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      uploadUrl: data.data?.upload_url ?? data.upload_url,
      fileUrl: data.data?.file_url ?? data.file_url,
      key: data.data?.key ?? data.key,
    });
  } catch (err) {
    console.error("[storage presign]", err);
    return NextResponse.json({ error: "Storage service unavailable" }, { status: 503 });
  }
}