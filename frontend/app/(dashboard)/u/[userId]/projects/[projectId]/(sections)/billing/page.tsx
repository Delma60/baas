// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/(<sections></sections>)/billing/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBillingOverview, getPlanLimits, getProjectUsageWithLimits, PLAN_DISPLAY } from "@/lib/api/billing-client";
import { BillingPageClient } from "@/components/billing/BillingPageClient";
import { getProjectUsage } from "@/lib/api/client";
import { APP_NAME } from "@/lib/utils/constants";

export const metadata: Metadata = { title: `Billing · ${APP_NAME}` };

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
  searchParams: Promise<{
    tab?: string;
    tx_ref?: string;
    transaction_id?: string;
    status?: string;
    _verify?: string;
  }>;
}

export default async function BillingPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId, projectId } = await params;
  const { tab = "overview", tx_ref, transaction_id, status } = await searchParams;

  // Fetch billing overview and plan limits in parallel; surface errors gracefully
  const [overview, planLimits, usageWithLimit, usage] = await Promise.all([
    getBillingOverview(projectId).catch((err) => {
      console.error("[BillingPage] getBillingOverview failed:", err?.message ?? err);
      return null;
    }),
    getPlanLimits().catch(() => []),
    getProjectUsageWithLimits(projectId).catch(() => null),
    getProjectUsage(projectId).catch(() => null),
  ]);
  console.log({ overview, planLimits, usageWithLimit, usage });

  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-12">
        <p className="text-sm font-medium text-text-primary">Failed to load billing information.</p>
        <p className="text-xs text-text-muted">
          Make sure the backend is running and migrations are up to date.
        </p>
      </div>
    );
  }

  return (
    <BillingPageClient
      userId={userId}
      projectId={projectId}
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? ""}
      overview={overview}
      planLimits={planLimits}
      planDisplay={PLAN_DISPLAY}
      initialTab={tab}
      returnTxRef={tx_ref}
      returnTxId={transaction_id}
      returnStatus={status}
      flutterwavePublicKey={process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY ?? ""}
    />
  );
}