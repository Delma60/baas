// frontend/lib/api/billing-client.ts
/**
 * Billing data client — calls FastAPI /internal/billing/* endpoints.
 * All data is real; no stubs.
 */

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? "";

export class BillingApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function internalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${FASTAPI_BASE_URL}/internal${path}`;
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": INTERNAL_SECRET,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const b = await res.json();
      msg = b?.detail ?? b?.error?.message ?? msg;
    } catch {}
    throw new BillingApiError(res.status, msg);
  }
  const json = await res.json();
  return (json.data ?? json) as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanName = "free" | "starter" | "pro";
export type InvoiceStatus = "paid" | "pending" | "failed";

export interface PlanLimits {
  plan: PlanName;
  sql_rows: number | null;
  nosql_docs: number | null;
  storage_bytes: number | null;
  function_calls: number | null;
  ai_requests: number | null;
  api_calls_per_min: number;
  team_members: number;
  price_ngn: number;
  price_usd: number;
}

export interface Subscription {
  id?: string;
  plan: PlanName;
  status: "active" | "canceled" | "past_due";
  flw_tx_ref?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  amount_ngn: number;
  amount_usd: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id: string;
  amount_ngn: number;
  amount_usd: number;
  status: InvoiceStatus;
  payment_ref: string | null;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface UsageSummary {
  db_reads: number;
  db_writes: number;
  nosql_reads: number;
  nosql_writes: number;
  storage_bytes: number;
  function_calls: number;
  ai_requests: number;
}

export interface BillingOverview {
  plan: PlanName;
  subscription: Subscription;
  invoices: Invoice[];
  usage: UsageSummary;
}

export interface ProjectUsage {
  usage: Record<string, number>;
  limits: Partial<PlanLimits>;
}

// ─── Plan display catalogue (static — mirrors plan_limits table) ──────────────

export interface BillingPlan {
  name: PlanName;
  description:string;
  displayName: string;
  priceNgn: number;
  priceUsd: number;
  features: string[];
  storageGb: number;
  teamMembers: number;
  cta:string;
}

export const PLAN_DISPLAY: Record<PlanName, BillingPlan> = {
  free: {
    name: "free",
    description:  'Free tier with basic limits',
    cta: "Upgrade to Starter",
    displayName: "Free",
    priceNgn: 0,
    priceUsd: 0,
    storageGb: 1,
    teamMembers: 1,
    features: ["50K SQL rows", "50K NoSQL docs", "1 GB storage", "100K fn calls/mo", "1 team member", "Community support"],
  },
  starter: {
    name: "starter",
    description: 'Starter plan with enhanced features',
    cta: "Upgrade to Starter",
    displayName: "Starter",
    priceNgn: 15000,
    priceUsd: 10,
    storageGb: 10,
    teamMembers: 3,
    features: ["500K SQL rows", "500K NoSQL docs", "10 GB storage", "1M fn calls/mo", "3 team members", "Email support"],
  },
  pro: {
    name: "pro",
    description: 'Pro plan with the most advanced features',
    cta:"Upgrade to Pro",
    displayName: "Pro",
    priceNgn: 45000,
    priceUsd: 30,
    storageGb: 100,
    teamMembers: 10,
    features: ["Unlimited SQL rows", "Unlimited NoSQL docs", "100 GB storage", "Unlimited fn calls", "10 team members", "Priority support"],
  },
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

export async function getBillingOverview(projectId: string): Promise<BillingOverview> {
  return internalFetch<BillingOverview>(`/billing/${projectId}/overview`);
}

export async function getProjectUsageWithLimits(projectId: string): Promise<ProjectUsage> {
  return internalFetch<ProjectUsage>(`/billing/usage/${projectId}`);
}

export async function getPlanLimits(): Promise<PlanLimits[]> {
  return internalFetch<PlanLimits[]>("/billing/plans");
}

export async function initiateCheckout(params: {
  projectId: string;
  plan: "starter" | "pro";
  userEmail: string;
  userName: string;
  currency: "NGN" | "USD";
  redirectUrl: string;
}): Promise<{ checkout_url: string; tx_ref: string }> {
  return internalFetch(`/billing/${params.projectId}/checkout/initiate`, {
    method: "POST",
    body: JSON.stringify({
      plan: params.plan,
      user_email: params.userEmail,
      user_name: params.userName,
      currency: params.currency,
      redirect_url: params.redirectUrl,
    }),
  });
}

export async function verifyCheckout(params: {
  projectId: string;
  txRef: string;
  transactionId: string;
}): Promise<{ verified: boolean; plan: PlanName; invoice_id: string }> {
  return internalFetch(`/billing/${params.projectId}/checkout/verify`, {
    method: "POST",
    body: JSON.stringify({
      tx_ref: params.txRef,
      transaction_id: params.transactionId,
    }),
  });
}

export async function cancelSubscription(projectId: string): Promise<{ cancel_at_period_end: boolean }> {
  return internalFetch(`/billing/${projectId}/cancel`, { method: "POST" });
}