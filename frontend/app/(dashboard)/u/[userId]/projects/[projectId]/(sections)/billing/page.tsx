// frontend/app/(dashboard)/u/[userId]/billing/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBillingOverview, getPlanLimits, PLAN_DISPLAY } from "@/lib/api/billing-client";
import { BillingPageClient } from "@/components/billing/BillingPageClient";
import { getProjectUsage } from "@/lib/api/client";

export const metadata: Metadata = { title: "Billing · YourBaaS" };

interface Props {
  params: Promise<{ userId: string, projectId:string }>;
  searchParams: Promise<{ tab?: string; tx_ref?: string; transaction_id?: string; status?: string }>;
}


export default async function BillingPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId, projectId } = await params;
  const { tab = "overview", tx_ref, transaction_id, status } = await searchParams;

  
  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-12">
        <p className="text-sm text-text-muted">
          No organization found. Create a project first.
        </p>
      </div>
    );
  }

  const [overview, planLimits, usage] = await Promise.all([
    getBillingOverview(projectId).catch(() => null),
    getPlanLimits().catch(() => []),
    getProjectUsage(projectId).catch(() => null),
  ]);
  console.log({overview, planLimits, usage})

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
      projectId={projectId}
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