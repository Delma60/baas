// frontend/app/api/internal/sql/rows/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function proxyToFastAPI(req: NextRequest, method: string) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, table, dbSchema, rowId, data } = body;

  if (!projectId || !table || !dbSchema) {
    return NextResponse.json(
      { error: "Missing required fields: projectId, table, dbSchema" },
      { status: 400 }
    );
  }

  if ((method === "PATCH" || method === "DELETE") && !rowId) {
    return NextResponse.json(
      { error: "Missing rowId — cannot update or delete without a row identifier" },
      { status: 400 }
    );
  }

  if (method === "POST" && (!data || Object.keys(data).length === 0)) {
    return NextResponse.json(
      { error: "No data provided for insert" },
      { status: 400 }
    );
  }

  let url: string;
  let fetchBody: string | undefined;

  if (method === "POST") {
    url = `${FASTAPI_BASE_URL}/internal/projects/${projectId}/sql/tables/${encodeURIComponent(table)}/rows`;
    fetchBody = JSON.stringify({ db_schema: dbSchema, data });
  } else if (method === "PATCH") {
    url = `${FASTAPI_BASE_URL}/internal/projects/${projectId}/sql/tables/${encodeURIComponent(table)}/rows/${encodeURIComponent(String(rowId))}`;
    fetchBody = JSON.stringify({ db_schema: dbSchema, data });
  } else {
    // DELETE
    url = `${FASTAPI_BASE_URL}/internal/projects/${projectId}/sql/tables/${encodeURIComponent(table)}/rows/${encodeURIComponent(String(rowId))}?db_schema=${encodeURIComponent(dbSchema)}`;
    fetchBody = undefined;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      ...(fetchBody !== undefined ? { body: fetchBody } : {}),
      cache: "no-store",
    });

    const responseData = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: responseData?.detail ?? `HTTP ${res.status}` },
        { status: res.status }
      );
    }
    return NextResponse.json(responseData);
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  return proxyToFastAPI(req, "POST");
}

export async function PATCH(req: NextRequest) {
  return proxyToFastAPI(req, "PATCH");
}

export async function DELETE(req: NextRequest) {
  return proxyToFastAPI(req, "DELETE");
}