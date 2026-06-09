// frontend/app/(dashboard)/u/[userId]/billing/page.tsx
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getBillingOverview,
  getInvoices,
  getUsageSummary,
  PLANS,
} from "@/lib/api/billing-client";
import { BillingPageClient } from "@/components/billing/BillingPageClient";

export const metadata: Metadata = { title: "Billing · YourBaaS" };

interface Props {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function BillingPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { userId } = await params;
  const { tab = "overview" } = await searchParams;

  const [overview, invoices, usage] = await Promise.all([
    getBillingOverview(session.user.id).catch(() => null),
    getInvoices(session.user.id).catch(() => []),
    getUsageSummary(session.user.id).catch(() => null),
  ]);

  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <p className="text-sm text-text-muted">Failed to load billing information.</p>
      </div>
    );
  }

  const currentPlan = PLANS[overview.currentPlan];

  return (
    <BillingPageClient
      userId={userId}
      overview={overview}
      currentPlan={currentPlan}
      invoices={invoices}
      usage={usage}
      allPlans={PLANS}
      initialTab={tab}
    />
  );
}