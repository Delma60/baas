// frontend/components/billing/BillingPageClient.tsx
"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  CreditCard, Receipt, BarChart3, Layers, CheckCircle2,
  AlertTriangle, ArrowUpRight, Calendar, Zap, Database,
  HardDrive, ShieldCheck, Sparkles, ChevronRight, ExternalLink,
  Download, Clock, RefreshCw, Info, CheckCheck, XCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BillingOverview, BillingPlan, Invoice, InvoiceStatus,
  PlanLimits, PlanName, Subscription, UsageSummary,
} from "@/lib/api/billing-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

function fmtNgn(n: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

// ─── Plan badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: PlanName }) {
  const s: Record<PlanName, string> = {
    free: "bg-surface text-text-muted border-border2",
    starter: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    pro: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  };
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", s[plan])}>
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const s: Record<InvoiceStatus, string> = {
    paid: "bg-success-bg text-success-text",
    pending: "bg-warn-bg text-warn-text",
    failed: "bg-danger-bg text-danger-text",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize", s[status])}>
      {status}
    </span>
  );
}

// ─── Usage bar ────────────────────────────────────────────────────────────────

function UsageBar({ label, icon: Icon, used, limit, unit }: {
  label: string; icon: React.ElementType;
  used: number; limit: number | null; unit?: "bytes";
}) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const bar = pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-brand";
  const displayUsed = unit === "bytes" ? formatBytes(used) : fmtNum(used);
  const displayLimit = limit === null ? "∞" : unit === "bytes" ? formatBytes(limit) : fmtNum(limit);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-[13px] text-text-secondary">{label}</span>
        </div>
        <span className="text-[12px] font-medium text-text-primary">
          {displayUsed}
          {limit !== null && <span className="text-text-muted font-normal"> / {displayLimit}</span>}
        </span>
      </div>
      {limit !== null && (
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

// ─── Checkout button ──────────────────────────────────────────────────────────

function CheckoutButton({
  projectId, plan, userEmail, userName, children, className,
}: {
  projectId: string; plan: "starter" | "pro";
  userEmail: string; userName: string;
  children: React.ReactNode; className?: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    try {
      const appUrl = window.location.origin;
      const redirectUrl = `${appUrl}/billing?tab=overview&_verify=1`;

      const res = await fetch("/api/internal/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          projectId,
          plan,
          user_email: userEmail,
          user_name: userName,
          currency: "NGN",
          redirect_url: redirectUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail ?? json?.error ?? "Checkout failed");
      const checkoutUrl = json.data?.checkout_url ?? json.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (e: any) {
      alert(e.message ?? "Could not initiate checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={cn("flex items-center justify-center gap-1.5", className)}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
    </button>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ overview, planDisplay, projectId, userEmail, userName, onTabChange }: {
  overview: BillingOverview;
  planDisplay: Record<PlanName, BillingPlan>;
  projectId: string;
  userEmail: string;
  userName: string;
  onTabChange: (t: string) => void;
}) {
  const plan = overview.plan;
  const sub = overview.subscription;
  const usage = overview.usage;
  const pd = planDisplay[plan];

  // Find plan limits for progress bars (rough inline calculation)
  const limits: Record<string, number | null> = {
    db_reads:      plan === "free" ? 50000 : plan === "starter" ? 500000 : null,
    nosql_reads:   plan === "free" ? 50000 : plan === "starter" ? 500000 : null,
    storage_bytes: plan === "free" ? 1073741824 : plan === "starter" ? 10737418240 : 107374182400,
    function_calls:plan === "free" ? 100000 : plan === "starter" ? 1000000 : null,
    ai_requests:   plan === "free" ? 500 : plan === "starter" ? 5000 : null,
  };

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <div className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10">
              <CreditCard className="h-5 w-5 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-text-primary">{pd.displayName} Plan</p>
                <PlanBadge plan={plan} />
              </div>
              {sub.current_period_end && (
                <p className="text-sm text-text-muted mt-0.5">
                  Renews {fmtDate(sub.current_period_end)}
                </p>
              )}
              {sub.cancel_at_period_end && (
                <p className="text-xs text-danger-text mt-0.5">Cancels at end of period</p>
              )}
            </div>
          </div>
          {plan !== "pro" && (
            <CheckoutButton
              projectId={projectId} plan={plan === "free" ? "starter" : "pro"}
              userEmail={userEmail} userName={userName}
              className="h-9 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-60"
            >
              Upgrade to {plan === "free" ? "Starter" : "Pro"}
              <ChevronRight className="h-3.5 w-3.5" />
            </CheckoutButton>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Price/mo", value: plan === "free" ? "Free" : `₦${(pd.priceNgn / 1000).toFixed(0)}k` },
            { label: "Storage", value: `${pd.storageGb} GB` },
            { label: "Team members", value: String(pd.teamMembers) },
            { label: "Status", value: sub.status === "active" ? "Active" : sub.status },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-surface px-3 py-3">
              <p className="text-lg font-bold text-text-primary">{s.value}</p>
              <p className="text-[11px] text-text-muted mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Billing dates */}
      {sub.current_period_start && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">Current period</p>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-text-secondary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {fmtDate(sub.current_period_start)} – {sub.current_period_end ? fmtDate(sub.current_period_end) : "–"}
                </p>
                <p className="text-[12px] text-text-muted">{fmtNgn(sub.amount_ngn)} / {sub.currency}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">Payment</p>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Paid via Flutterwave</p>
                {sub.flw_tx_ref && <p className="text-[12px] text-text-muted font-mono truncate">{sub.flw_tx_ref}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage */}
      <div className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Usage this period</p>
          <button onClick={() => onTabChange("usage")} className="text-[12px] font-medium text-brand hover:underline flex items-center gap-1">
            Details <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UsageBar label="SQL reads" icon={Database} used={usage.db_reads} limit={limits.db_reads} />
          <UsageBar label="NoSQL reads" icon={Layers} used={usage.nosql_reads} limit={limits.nosql_reads} />
          <UsageBar label="Storage" icon={HardDrive} used={usage.storage_bytes} limit={limits.storage_bytes} unit="bytes" />
          <UsageBar label="Function calls" icon={Zap} used={usage.function_calls} limit={limits.function_calls} />
        </div>
      </div>
    </div>
  );
}

// ─── Plans tab ────────────────────────────────────────────────────────────────

function PlansTab({ currentPlan, planDisplay, planLimits, projectId, userEmail, userName }: {
  currentPlan: PlanName;
  planDisplay: Record<PlanName, BillingPlan>;
  planLimits: PlanLimits[];
  projectId: string;
  userEmail: string;
  userName: string;
}) {
  const plans = Object.values(planDisplay) as BillingPlan[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentPlan;
          const canUpgrade = plan.name !== currentPlan && plan.priceNgn > (planDisplay[currentPlan]?.priceNgn ?? 0);

          return (
            <div key={plan.name} className={cn(
              "relative rounded-2xl border p-5 flex flex-col",
              isCurrent ? "border-brand bg-brand/[0.03]" : "border-border bg-background",
              plan.name === "pro" && !isCurrent && "border-amber-200 dark:border-amber-800",
            )}>
              {plan.name === "pro" && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm whitespace-nowrap">
                  Most popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-brand px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Current
                </span>
              )}

              <div className="mb-4">
                <p className="text-base font-bold text-text-primary">{plan.displayName}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  {plan.priceNgn === 0 ? (
                    <span className="text-2xl font-black text-text-primary">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-text-primary">₦{(plan.priceNgn / 1000).toFixed(0)}k</span>
                      <span className="text-[12px] text-text-muted">/ mo · ${plan.priceUsd} USD</span>
                    </>
                  )}
                </div>
              </div>

              <ul className="flex flex-col gap-2 flex-1 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                    <span className="text-[13px] text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="flex items-center justify-center h-9 rounded-lg border border-brand/30 bg-brand/5 text-[13px] font-medium text-brand">
                  Current plan
                </div>
              ) : canUpgrade ? (
                <CheckoutButton
                  projectId={projectId}
                  plan={plan.name as "starter" | "pro"}
                  userEmail={userEmail}
                  userName={userName}
                  className="h-9 rounded-lg bg-brand text-[13px] font-semibold text-white hover:bg-brand-hover transition-colors disabled:opacity-60 w-full"
                >
                  Upgrade to {plan.displayName}
                  <ChevronRight className="h-3.5 w-3.5" />
                </CheckoutButton>
              ) : (
                <div className="h-9" />
              )}
            </div>
          );
        })}
      </div>

      {/* Limits comparison table */}
      {planLimits.length > 0 && (
        <div className="rounded-2xl border border-border bg-background overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-surface">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Full plan comparison</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-[12px] font-medium text-text-secondary">Feature</th>
                  {planLimits.map((p) => (
                    <th key={p.plan} className="px-5 py-3 text-center text-[12px] font-medium text-text-secondary capitalize">
                      {p.plan}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { label: "SQL rows", key: "sql_rows" as keyof PlanLimits, fmt: (v: any) => v === null ? "Unlimited" : fmtNum(v) },
                  { label: "NoSQL docs", key: "nosql_docs" as keyof PlanLimits, fmt: (v: any) => v === null ? "Unlimited" : fmtNum(v) },
                  { label: "Storage", key: "storage_bytes" as keyof PlanLimits, fmt: (v: any) => v === null ? "Unlimited" : formatBytes(v) },
                  { label: "Function calls", key: "function_calls" as keyof PlanLimits, fmt: (v: any) => v === null ? "Unlimited" : fmtNum(v) },
                  { label: "API calls/min", key: "api_calls_per_min" as keyof PlanLimits, fmt: (v: any) => String(v) },
                  { label: "Team members", key: "team_members" as keyof PlanLimits, fmt: (v: any) => String(v) },
                  { label: "Price/mo (NGN)", key: "price_ngn" as keyof PlanLimits, fmt: (v: any) => v === 0 ? "Free" : fmtNgn(v) },
                ].map((row) => (
                  <tr key={row.label} className="hover:bg-surface/50">
                    <td className="px-5 py-3 text-[13px] text-text-secondary">{row.label}</td>
                    {planLimits.map((p) => (
                      <td key={p.plan} className={cn("px-5 py-3 text-center text-[13px]", p.plan === currentPlan ? "text-brand font-semibold" : "text-text-primary")}>
                        {row.fmt(p[row.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invoices tab ─────────────────────────────────────────────────────────────

function InvoicesTab({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border2 bg-surface flex flex-col items-center justify-center gap-3 py-20 px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
          <Receipt className="h-5 w-5 text-text-muted" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">No invoices yet</p>
          <p className="text-[13px] text-text-muted mt-1">Invoices are generated when you upgrade your plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-surface">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Period</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Amount</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Status</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">&nbsp;</span>
      </div>
      <div className="divide-y divide-border">
        {invoices.map((inv) => (
          <div key={inv.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-4 hover:bg-surface/50 transition-colors">
            <div>
              <p className="text-[14px] font-medium text-text-primary">{fmtDate(inv.period_start)}</p>
              <p className="text-[12px] text-text-muted mt-0.5">{fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}</p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-semibold text-text-primary">{fmtNgn(inv.amount_ngn)}</p>
              {inv.amount_usd > 0 && <p className="text-[11px] text-text-muted">${inv.amount_usd}</p>}
            </div>
            <StatusBadge status={inv.status} />
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors" title="Download">
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Usage detail tab ─────────────────────────────────────────────────────────

function UsageTab({ usage, plan }: { usage: UsageSummary; plan: PlanName }) {
  const limits: Record<string, { limit: number | null; unit?: "bytes" }> = {
    db_reads:      { limit: plan === "free" ? 50000 : plan === "starter" ? 500000 : null },
    db_writes:     { limit: plan === "free" ? 50000 : plan === "starter" ? 500000 : null },
    nosql_reads:   { limit: plan === "free" ? 50000 : plan === "starter" ? 500000 : null },
    nosql_writes:  { limit: plan === "free" ? 50000 : plan === "starter" ? 500000 : null },
    storage_bytes: { limit: plan === "free" ? 1073741824 : plan === "starter" ? 10737418240 : 107374182400, unit: "bytes" },
    function_calls:{ limit: plan === "free" ? 100000 : plan === "starter" ? 1000000 : null },
    ai_requests:   { limit: plan === "free" ? 500 : plan === "starter" ? 5000 : null },
  };

  const rows = [
    { key: "db_reads", label: "SQL reads", icon: Database },
    { key: "db_writes", label: "SQL writes", icon: Database },
    { key: "nosql_reads", label: "NoSQL reads", icon: Layers },
    { key: "nosql_writes", label: "NoSQL writes", icon: Layers },
    { key: "storage_bytes", label: "Storage", icon: HardDrive },
    { key: "function_calls", label: "Function calls", icon: Zap },
    { key: "ai_requests", label: "AI requests", icon: Sparkles },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">Rolling 30-day window</p>
        <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
          <Clock className="h-3 w-3" />
          Updated hourly
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-background divide-y divide-border overflow-hidden">
        {rows.map((row) => {
          const used = (usage as any)[row.key] ?? 0;
          const { limit, unit } = limits[row.key];
          const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
          const bar = pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-brand";
          const displayUsed = unit === "bytes" ? formatBytes(used) : fmtNum(used);
          const displayLimit = limit === null ? "∞" : unit === "bytes" ? formatBytes(limit) : fmtNum(limit);
          const Icon = row.icon;

          return (
            <div key={row.key} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface">
                <Icon className="h-4 w-4 text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-text-primary">{row.label}</span>
                  <span className="text-[13px] font-semibold text-text-primary">
                    {displayUsed}
                    {limit !== null && <span className="text-text-muted font-normal"> / {displayLimit}</span>}
                  </span>
                </div>
                {limit !== null && (
                  <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
              {pct >= 80 && limit !== null && <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Return banner (after Flutterwave redirect) ───────────────────────────────

function ReturnBanner({ txRef, txId, status, projectId, onDismiss }: {
  txRef?: string; txId?: string; status?: string;
  projectId: string; onDismiss: () => void;
}) {
  const [verifying, setVerifying] = React.useState(false);
  const [result, setResult] = React.useState<null | { success: boolean; message: string }>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (!txRef || !txId || status !== "successful") {
      if (status && status !== "successful") {
        setResult({ success: false, message: "Payment was not completed. Please try again." });
      }
      return;
    }
    setVerifying(true);
    fetch("/api/internal/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", projectId, tx_ref: txRef, transaction_id: txId }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.verified) {
          setResult({ success: true, message: `Plan upgraded to ${json.data.plan}. Welcome to ${json.data.plan}!` });
          // Refresh the page data
          router.refresh();
        } else {
          setResult({ success: false, message: json?.detail ?? "Verification failed. Contact support." });
        }
      })
      .catch(() => setResult({ success: false, message: "Verification failed. Contact support." }))
      .finally(() => setVerifying(false));
  }, []);

  if (!txRef && !txId) return null;

  return (
    <div className={cn(
      "mb-6 rounded-2xl border px-5 py-4 flex items-start gap-3",
      result?.success ? "border-success-bg bg-success-bg/40" : result?.success === false ? "border-danger-bg bg-danger-bg/40" : "border-info-bg bg-info-bg/40"
    )}>
      {verifying ? (
        <Loader2 className="h-5 w-5 text-info-text animate-spin shrink-0 mt-0.5" />
      ) : result?.success ? (
        <CheckCheck className="h-5 w-5 text-success-text shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-danger-text shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-text-primary">
          {verifying ? "Verifying your payment…" : result?.success ? "Payment confirmed!" : "Payment issue"}
        </p>
        {result && <p className="text-[13px] text-text-secondary mt-0.5">{result.message}</p>}
      </div>
      {!verifying && (
        <button onClick={onDismiss} className="text-text-muted hover:text-text-primary transition-colors">
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "plans", label: "Plans", icon: Layers },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "usage", label: "Usage", icon: Database },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface Props {
  userId: string;
  projectId: string;
  userEmail: string;
  userName: string;
  overview: BillingOverview;
  planLimits: PlanLimits[];
  planDisplay: Record<PlanName, BillingPlan>;
  initialTab: string;
  returnTxRef?: string;
  returnTxId?: string;
  returnStatus?: string;
  flutterwavePublicKey: string;
}

export function BillingPageClient({
  userId, projectId, userEmail, userName,
  overview, planLimits, planDisplay,
  initialTab, returnTxRef, returnTxId, returnStatus,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<TabId>((initialTab as TabId) || "overview");
  const [showReturnBanner, setShowReturnBanner] = React.useState(!!(returnTxRef || returnStatus));

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    // Remove return params
    params.delete("tx_ref"); params.delete("transaction_id"); params.delete("status"); params.delete("_verify");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 sm:px-6 py-4 sm:py-5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand/10">
          <CreditCard className="h-4 w-4 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-medium text-text-primary">Billing</h1>
          <p className="text-sm text-text-secondary mt-0.5 hidden sm:block">Manage your plan, invoices, and usage</p>
        </div>
        <PlanBadge plan={overview.plan} />
      </div>

      {/* Tab bar */}
      <div className="border-b border-border bg-background px-4 sm:px-6 shrink-0">
        <nav className="flex gap-0 -mb-px overflow-x-auto" aria-label="Billing sections">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 h-11 px-3 sm:px-4 text-[13px] font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap",
                  isActive ? "border-brand text-brand" : "border-transparent text-text-secondary hover:text-text-primary hover:border-border2",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Return banner after Flutterwave redirect */}
          {showReturnBanner && (
            <ReturnBanner
              txRef={returnTxRef}
              txId={returnTxId}
              status={returnStatus}
              projectId={projectId}
              onDismiss={() => setShowReturnBanner(false)}
            />
          )}

          {activeTab === "overview" && (
            <OverviewTab
              overview={overview}
              planDisplay={planDisplay}
              projectId={projectId}
              userEmail={userEmail}
              userName={userName}
              onTabChange={handleTabChange}
            />
          )}
          {activeTab === "plans" && (
            <PlansTab
              currentPlan={overview.plan}
              planDisplay={planDisplay}
              planLimits={planLimits}
              projectId={projectId}
              userEmail={userEmail}
              userName={userName}
            />
          )}
          {activeTab === "invoices" && <InvoicesTab invoices={overview.invoices} />}
          {activeTab === "usage" && <UsageTab usage={overview.usage} plan={overview.plan} />}
        </div>
      </div>
    </div>
  );
}