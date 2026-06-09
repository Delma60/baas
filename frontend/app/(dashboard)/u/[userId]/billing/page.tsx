// frontend/app/(dashboard)/u/[userId]/billing/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBillingOverview, getPlanLimits, PLAN_DISPLAY } from "@/lib/api/billing-client";
import { BillingPageClient } from "@/components/billing/BillingPageClient";

export const metadata: Metadata = { title: "Billing · YourBaaS" };

interface Props {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string; tx_ref?: string; transaction_id?: string; status?: string }>;
}

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

async function getOrgIdForUser(userId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/users/${userId}/projects`,
      { cache: "no-store", headers: { "x-internal-secret": INTERNAL_SECRET } }
    );
    if (!res.ok) return null;
    // We need the org id — fetch the user's org directly
    const orgRes = await fetch(
      `${FASTAPI_BASE_URL}/internal/auth/org?user_id=${userId}`,
      { cache: "no-store", headers: { "x-internal-secret": INTERNAL_SECRET } }
    );
    if (!orgRes.ok) return null;
    const json = await orgRes.json();
    return json.data?.org_id ?? null;
  } catch {
    return null;
  }
}

async function getOrgId(userId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `${FASTAPI_BASE_URL}/internal/users/${userId}/org`,
      { cache: "no-store", headers: { "x-internal-secret": INTERNAL_SECRET } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.org_id ?? null;
  } catch {
    return null;
  }
}

export default async function BillingPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId } = await params;
  const { tab = "overview", tx_ref, transaction_id, status } = await searchParams;

  // Fetch the org id for this user
  const orgId = await getOrgId(userId);

  if (!orgId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-12">
        <p className="text-sm text-text-muted">
          No organization found. Create a project first.
        </p>
      </div>
    );
  }

  const [overview, planLimits] = await Promise.all([
    getBillingOverview(orgId).catch(() => null),
    getPlanLimits().catch(() => []),
  ]);

  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <p className="text-sm text-text-muted">Failed to load billing information.</p>
      </div>
    );
  }

  return (
    <BillingPageClient
      userId={userId}
      orgId={orgId}
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? ""}
      overview={overview}
      planLimits={planLimits}
      planDisplay={PLAN_DISPLAY}
      initialTab={tab}
      // Flutterwave return params
      returnTxRef={tx_ref}
      returnTxId={transaction_id}
      returnStatus={status}
      flutterwavePublicKey={process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY ?? ""}
    />
  );
}