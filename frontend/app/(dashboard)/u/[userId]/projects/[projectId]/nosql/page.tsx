// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/nosql/page.tsx
import type { Metadata } from "next";
import { getProjectById } from "@/lib/api/client";
import { getNoSQLCollections, getKVKeys } from "@/lib/api/nosql-client";
import { NoSQLPageClient } from "@/components/nosql/NoSQLPageClient";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
  searchParams: Promise<{ tab?: string; collection?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;
  return { title: `NoSQL · ${projectId}` };
}

export default async function NoSQLPage({ params, searchParams }: Props) {
  const { userId, projectId } = await params;
  const { tab = "collections", collection } = await searchParams;

  // Fetch project info for mongo_database
  const project = await getProjectById(projectId);
  const mongoDatabase = (project as any).mongo_database ?? "";

  // Fetch collections list
  let collections: string[] = [];
  let kvKeys: any[] = [];
  let selectedCollectionDocs: any = null;
  let collectionTotal = 0;

  try {
    collections = await getNoSQLCollections(projectId, mongoDatabase);
  } catch {
    collections = [];
  }

  if (tab === "kv") {
    try {
      const kvResult = await getKVKeys(projectId, mongoDatabase);
      kvKeys = kvResult.entries;
    } catch {
      kvKeys = [];
    }
  }

  if (tab === "collections" && collection) {
    try {
      const result = await import("@/lib/api/nosql-client").then(m =>
        m.getCollectionDocuments(projectId, mongoDatabase, collection, { limit: 50, skip: 0 })
      );
      selectedCollectionDocs = result.docs;
      collectionTotal = result.total;
    } catch {
      selectedCollectionDocs = [];
      collectionTotal = 0;
    }
  }

  return (
    <NoSQLPageClient
      userId={userId}
      projectId={projectId}
      mongoDatabase={mongoDatabase}
      initialTab={tab}
      initialCollection={collection}
      collections={collections}
      kvKeys={kvKeys}
      initialDocs={selectedCollectionDocs}
      initialTotal={collectionTotal}
    />
  );
}