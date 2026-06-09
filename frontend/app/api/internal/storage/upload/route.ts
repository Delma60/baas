// frontend/app/api/internal/storage/upload/route.ts
/**
 * Proxies file uploads server-side to avoid CORS when PUTting directly
 * to Backblaze B2 / MinIO from the browser.
 *
 * Flow:
 *   Browser → POST /api/internal/storage/upload (multipart, same-origin)
 *   Next.js  → POST FastAPI /internal/.../presign-upload  (server → server)
 *   Next.js  → PUT  <presigned-url>                       (server → B2, no CORS)
 *   Browser  ← { key, fileUrl }
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const projectId = formData.get("projectId") as string | null;
  const bucket = formData.get("bucket") as string | null;

  if (!file || !projectId || !bucket) {
    return NextResponse.json(
      { error: "Missing required fields: file, projectId, bucket" },
      { status: 400 },
    );
  }

  const contentType = file.type || "application/octet-stream";

  // ── 1. Get presigned upload URL from FastAPI ──────────────────────────────
  let uploadUrl: string;
  let fileUrl: string;
  let key: string;

  try {
    const presignRes = await fetch(
      `${FASTAPI_BASE_URL}/internal/storage/${projectId}/${bucket}/presign-upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": INTERNAL_SECRET,
        },
        body: JSON.stringify({
          filename: file.name,
          content_type: contentType,
          expires_in: 3600,
        }),
      },
    );

    if (!presignRes.ok) {
      const body = await presignRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: body?.detail ?? `Failed to get upload URL (${presignRes.status})` },
        { status: presignRes.status },
      );
    }

    const json = await presignRes.json();
    const result = json.data ?? json;
    uploadUrl = result.upload_url;
    fileUrl = result.file_url;
    key = result.key;
  } catch (err) {
    console.error("[storage/upload] presign error:", err);
    return NextResponse.json({ error: "Storage service unreachable" }, { status: 503 });
  }

  // ── 2. Stream file to storage from the server (no browser CORS) ──────────
  try {
    const bytes = await file.arrayBuffer();

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: bytes,
      headers: { "Content-Type": contentType },
    });

    if (!uploadRes.ok) {
      const body = await uploadRes.text().catch(() => "");
      console.error("[storage/upload] PUT failed:", uploadRes.status, body);
      return NextResponse.json(
        { error: `Storage PUT failed: ${uploadRes.status}` },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[storage/upload] PUT error:", err);
    return NextResponse.json({ error: "Upload to storage failed" }, { status: 502 });
  }

  return NextResponse.json({ key, fileUrl, size: file.size });
}