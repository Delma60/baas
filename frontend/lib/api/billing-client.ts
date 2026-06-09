// frontend/lib/api/billing-client.ts
/**
 * Billing data client.
 *
 * In production this will call /admin-api/* endpoints (the standalone admin
 * platform).  While that platform is being built the helpers below return
 * hardcoded stub data so the UI can be developed end-to-end.
 *
 * When the admin platform is ready, replace each helper with a real fetch
 * to ADMIN_API_BASE_URL using a service-role API key + X-Admin-Integration-Secret.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanName = "free" | "starter" | "pro";
export type InvoiceStatus = "paid" | "pending" | "failed";

export interface BillingPlan {
  name: PlanName;
  displayName: string;
  priceNgn: number;
  priceUsd: number;
  features: string[];
  sqlRows: string;
  nosqlDocs: string;
  storageGb: number;
  functionCalls: string;
  teamMembers: number;
  support: string;
}

export interface Invoice {
  id: string;
  period: string;          // "May 2026"
  amount_ngn: number;
  amount_usd: number;
  status: InvoiceStatus;
  payment_ref: string | null;
  created_at: string;
  period_start: string;
  period_end: string;
}

export interface BillingOverview {
  currentPlan: PlanName;
  nextBillingDate: string | null;
  nextAmount_ngn: number;
  nextAmount_usd: number;
  /** ISO string of when the plan was activated */
  planSince: string;
  paymentMethod: "paystack" | "stripe" | "none";
  /** last 4 digits of card on file, or null */
  cardLast4: string | null;
  cardBrand: string | null;
}

export interface UsageSummary {
  dbReads: number;
  dbWrites: number;
  nosqlReads: number;
  nosqlWrites: number;
  storageBytes: number;
  functionCalls: number;
  aiRequests: number;
}

// ─── Plans catalogue (source of truth — mirrors backend/config/plans.ts) ─────

export const PLANS: Record<PlanName, BillingPlan> = {
  free: {
    name: "free",
    displayName: "Free",
    priceNgn: 0,
    priceUsd: 0,
    sqlRows: "50,000",
    nosqlDocs: "50,000",
    storageGb: 1,
    functionCalls: "100,000 / mo",
    teamMembers: 1,
    support: "Community",
    features: [
      "50K SQL rows",
      "50K NoSQL documents",
      "1 GB storage",
      "100K function calls/mo",
      "1 team member",
      "Community support",
    ],
  },
  starter: {
    name: "starter",
    displayName: "Starter",
    priceNgn: 15_000,
    priceUsd: 10,
    sqlRows: "500,000",
    nosqlDocs: "500,000",
    storageGb: 10,
    functionCalls: "1M / mo",
    teamMembers: 3,
    support: "Email",
    features: [
      "500K SQL rows",
      "500K NoSQL documents",
      "10 GB storage",
      "1M function calls/mo",
      "3 team members",
      "Email support",
    ],
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    priceNgn: 45_000,
    priceUsd: 30,
    sqlRows: "Unlimited",
    nosqlDocs: "Unlimited",
    storageGb: 100,
    functionCalls: "Unlimited",
    teamMembers: 10,
    support: "Priority",
    features: [
      "Unlimited SQL rows",
      "Unlimited NoSQL documents",
      "100 GB storage",
      "Unlimited function calls",
      "10 team members",
      "Priority support",
    ],
  },
};

// ─── Hardcoded stubs (replace with admin-api calls when ready) ───────────────

/**
 * TODO: replace with:
 *   fetch(`${ADMIN_API_BASE_URL}/billing/overview?org_id=${orgId}`, {
 *     headers: {
 *       Authorization: `Bearer ${SERVICE_KEY}`,
 *       "x-admin-integration-secret": ADMIN_INTEGRATION_SECRET,
 *     },
 *   })
 */
export async function getBillingOverview(_userId: string): Promise<BillingOverview> {
  // Stub — free plan, no payment method
  return {
    currentPlan: "free",
    nextBillingDate: null,
    nextAmount_ngn: 0,
    nextAmount_usd: 0,
    planSince: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    paymentMethod: "none",
    cardLast4: null,
    cardBrand: null,
  };
}

/**
 * TODO: replace with admin-api /billing/invoices?org_id=
 */
export async function getInvoices(_userId: string): Promise<Invoice[]> {
  // Stub — empty history for free plan
  return [];
}

/**
 * TODO: replace with internal usage endpoint aggregated per org
 */
export async function getUsageSummary(_userId: string): Promise<UsageSummary> {
  return {
    dbReads: 3_420,
    dbWrites: 891,
    nosqlReads: 1_205,
    nosqlWrites: 330,
    storageBytes: 48_000_000, // ~48 MB
    functionCalls: 2_800,
    aiRequests: 45,
  };
}