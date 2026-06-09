// frontend/components/billing/BillingPageClient.tsx
"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Receipt,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Zap,
  Database,
  HardDrive,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Download,
  Clock,
  RefreshCw,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  BillingOverview,
  BillingPlan,
  Invoice,
  InvoiceStatus,
  PlanName,
  UsageSummary,
} from "@/lib/api/billing-client";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function formatNgn(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function usagePercent(used: number, limit: number | null): number {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: PlanName }) {
  const styles: Record<PlanName, string> = {
    free: "bg-surface text-text-muted border-border2",
    starter:
      "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
    pro: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  };
  const label: Record<PlanName, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
  };
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        styles[plan],
      )}
    >
      {label[plan]}
    </span>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const styles: Record<InvoiceStatus, string> = {
    paid: "bg-success-bg text-success-text",
    pending: "bg-warn-bg text-warn-text",
    failed: "bg-danger-bg text-danger-text",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

function UsageBar({
  label,
  icon: Icon,
  used,
  limit,
  unit,
}: {
  label: string;
  icon: React.ElementType;
  used: number;
  limit: number | null;
  unit?: string;
}) {
  const pct = usagePercent(used, limit ?? 0);
  const barColor =
    pct >= 90
      ? "bg-danger"
      : pct >= 70
        ? "bg-warning"
        : "bg-brand";

  const displayUsed =
    unit === "bytes" ? formatBytes(used) : formatNumber(used);
  const displayLimit =
    limit === null
      ? "∞"
      : unit === "bytes"
        ? formatBytes(limit)
        : formatNumber(limit);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-[13px] text-text-secondary">{label}</span>
        </div>
        <span className="text-[12px] font-medium text-text-primary">
          {displayUsed}
          {limit !== null && (
            <span className="text-text-muted font-normal"> / {displayLimit}</span>
          )}
        </span>
      </div>
      {limit !== null && (
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({
  overview,
  currentPlan,
  usage,
  userId,
  onTabChange,
}: {
  overview: BillingOverview;
  currentPlan: BillingPlan;
  usage: UsageSummary | null;
  userId: string;
  onTabChange: (tab: string) => void;
}) {
  const SQL_LIMIT = currentPlan.name === "free" ? 50_000 : currentPlan.name === "starter" ? 500_000 : null;
  const NOSQL_LIMIT = SQL_LIMIT;
  const STORAGE_LIMIT = currentPlan.storageGb * 1024 * 1024 * 1024;
  const FN_LIMIT = currentPlan.name === "free" ? 100_000 : currentPlan.name === "starter" ? 1_000_000 : null;

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
                <p className="text-base font-semibold text-text-primary">
                  {currentPlan.displayName} Plan
                </p>
                <PlanBadge plan={currentPlan.name} />
              </div>
              <p className="text-sm text-text-muted mt-0.5">
                Active since {formatDate(overview.planSince)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentPlan.name !== "pro" && (
              <button
                onClick={() => onTabChange("plans")}
                className="flex items-center gap-1.5 h-9 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-hover transition-colors"
              >
                Upgrade plan
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Plan stats grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "SQL rows", value: currentPlan.sqlRows },
            { label: "NoSQL docs", value: currentPlan.nosqlDocs },
            { label: "Storage", value: `${currentPlan.storageGb} GB` },
            { label: "Team members", value: String(currentPlan.teamMembers) },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-surface px-3 py-3"
            >
              <p className="text-lg font-bold text-text-primary">{s.value}</p>
              <p className="text-[11px] text-text-muted mt-0.5 uppercase tracking-wide">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Billing info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">
            Next billing
          </p>
          {overview.nextBillingDate ? (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-text-secondary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {formatDate(overview.nextBillingDate)}
                </p>
                <p className="text-[12px] text-text-muted">
                  {formatNgn(overview.nextAmount_ngn)} /{" "}
                  ${overview.nextAmount_usd} USD
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <p className="text-sm text-text-secondary">
                You&apos;re on the free plan — no billing
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3">
            Payment method
          </p>
          {overview.paymentMethod === "none" ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">No card on file</p>
              <button
                onClick={() => onTabChange("payment")}
                className="text-[13px] font-medium text-brand hover:underline"
              >
                Add card
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-text-secondary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary capitalize">
                  {overview.cardBrand} ···· {overview.cardLast4}
                </p>
                <p className="text-[12px] text-text-muted">
                  via{" "}
                  {overview.paymentMethod === "paystack" ? "Paystack" : "Stripe"}
                </p>
              </div>
              <button
                onClick={() => onTabChange("payment")}
                className="text-[12px] text-text-muted hover:text-brand transition-colors"
              >
                Update
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Usage this month */}
      {usage && (
        <div className="rounded-2xl border border-border bg-background p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Usage this month
            </p>
            <button
              onClick={() => onTabChange("usage")}
              className="text-[12px] font-medium text-brand hover:underline flex items-center gap-1"
            >
              Details <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UsageBar
              label="SQL reads + writes"
              icon={Database}
              used={usage.dbReads + usage.dbWrites}
              limit={SQL_LIMIT}
            />
            <UsageBar
              label="NoSQL reads + writes"
              icon={Layers}
              used={usage.nosqlReads + usage.nosqlWrites}
              limit={NOSQL_LIMIT}
            />
            <UsageBar
              label="Storage used"
              icon={HardDrive}
              used={usage.storageBytes}
              limit={STORAGE_LIMIT}
              unit="bytes"
            />
            <UsageBar
              label="Function calls"
              icon={Zap}
              used={usage.functionCalls}
              limit={FN_LIMIT}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Plans ───────────────────────────────────────────────────────────────

function PlansTab({
  currentPlan,
  allPlans,
}: {
  currentPlan: BillingPlan;
  allPlans: Record<PlanName, BillingPlan>;
}) {
  const plans = Object.values(allPlans);

  return (
    <div className="space-y-6">
      <Alert className="border-info-bg bg-info-bg/40">
        <Info className="h-4 w-4 text-info-text" />
        <AlertDescription className="text-[13px] text-info-text">
          Plan upgrades are currently handled manually.{" "}
          <a
            href="mailto:billing@yourbaas.com"
            className="font-semibold underline hover:no-underline"
          >
            Contact billing
          </a>{" "}
          to upgrade or we&apos;ll add Paystack/Stripe checkout here soon.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentPlan.name;
          const isUpgrade =
            plan.name === "pro"
              ? currentPlan.name !== "pro"
              : plan.name === "starter" && currentPlan.name === "free";

          return (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border p-5 flex flex-col",
                isCurrent
                  ? "border-brand bg-brand/[0.03]"
                  : "border-border bg-background",
                plan.name === "pro" && !isCurrent && "border-amber-200 dark:border-amber-800",
              )}
            >
              {plan.name === "pro" && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                  Most popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-brand px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Current
                </span>
              )}

              <div className="mb-4">
                <p className="text-base font-bold text-text-primary">
                  {plan.displayName}
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  {plan.priceNgn === 0 ? (
                    <span className="text-2xl font-black text-text-primary">
                      Free
                    </span>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-text-primary">
                        ₦{(plan.priceNgn / 1000).toFixed(0)}k
                      </span>
                      <span className="text-[12px] text-text-muted">
                        / mo · ${plan.priceUsd} USD
                      </span>
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
              ) : isUpgrade ? (
                <a
                  href="mailto:billing@yourbaas.com?subject=Upgrade request"
                  className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-brand text-[13px] font-semibold text-white hover:bg-brand-hover transition-colors"
                >
                  Upgrade to {plan.displayName}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <div className="h-9" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Invoices ────────────────────────────────────────────────────────────

function InvoicesTab({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border2 bg-surface flex flex-col items-center justify-center gap-3 py-20 px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
          <Receipt className="h-5 w-5 text-text-muted" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">No invoices yet</p>
          <p className="text-[13px] text-text-muted mt-1">
            Invoices are generated on the 1st of each month for paid plans.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background overflow-hidden">
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-surface">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Period
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Amount
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Status
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          &nbsp;
        </span>
      </div>
      <div className="divide-y divide-border">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-4 hover:bg-surface/50 transition-colors"
          >
            <div>
              <p className="text-[14px] font-medium text-text-primary">
                {inv.period}
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-semibold text-text-primary">
                {formatNgn(inv.amount_ngn)}
              </p>
              <p className="text-[11px] text-text-muted">${inv.amount_usd}</p>
            </div>
            <StatusBadge status={inv.status} />
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors">
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Usage detail ────────────────────────────────────────────────────────

function UsageTab({
  usage,
  currentPlan,
}: {
  usage: UsageSummary | null;
  currentPlan: BillingPlan;
}) {
  if (!usage) {
    return (
      <p className="text-sm text-text-muted p-4">Usage data unavailable.</p>
    );
  }

  const SQL_LIMIT =
    currentPlan.name === "free"
      ? 50_000
      : currentPlan.name === "starter"
        ? 500_000
        : null;
  const NOSQL_LIMIT = SQL_LIMIT;
  const STORAGE_LIMIT = currentPlan.storageGb * 1024 * 1024 * 1024;
  const FN_LIMIT =
    currentPlan.name === "free"
      ? 100_000
      : currentPlan.name === "starter"
        ? 1_000_000
        : null;

  const rows = [
    { label: "SQL reads", icon: Database, used: usage.dbReads, limit: SQL_LIMIT },
    { label: "SQL writes", icon: Database, used: usage.dbWrites, limit: SQL_LIMIT },
    { label: "NoSQL reads", icon: Layers, used: usage.nosqlReads, limit: NOSQL_LIMIT },
    { label: "NoSQL writes", icon: Layers, used: usage.nosqlWrites, limit: NOSQL_LIMIT },
    { label: "Storage used", icon: HardDrive, used: usage.storageBytes, limit: STORAGE_LIMIT, unit: "bytes" as const },
    { label: "Function calls", icon: Zap, used: usage.functionCalls, limit: FN_LIMIT },
    { label: "AI requests", icon: Sparkles, used: usage.aiRequests, limit: null },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-text-muted">
          Rolling 30-day window · resets daily
        </p>
        <div className="flex items-center gap-1.5 text-[12px] text-text-muted">
          <Clock className="h-3 w-3" />
          Updated every 5 min
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-background divide-y divide-border overflow-hidden">
        {rows.map((row) => {
          const pct = row.limit ? usagePercent(row.used, row.limit) : 0;
          const displayUsed =
            row.unit === "bytes"
              ? formatBytes(row.used)
              : formatNumber(row.used);
          const displayLimit =
            row.limit === null
              ? "∞"
              : row.unit === "bytes"
                ? formatBytes(row.limit)
                : formatNumber(row.limit);
          const Icon = row.icon;
          const barColor =
            pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-warning" : "bg-brand";

          return (
            <div
              key={row.label}
              className="flex items-center gap-4 px-5 py-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface">
                <Icon className="h-4 w-4 text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-medium text-text-primary">
                    {row.label}
                  </span>
                  <span className="text-[13px] font-semibold text-text-primary">
                    {displayUsed}
                    {row.limit !== null && (
                      <span className="text-text-muted font-normal">
                        {" "}/ {displayLimit}
                      </span>
                    )}
                  </span>
                </div>
                {row.limit !== null && (
                  <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        barColor,
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>
              {pct >= 80 && row.limit !== null && (
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab: Payment method ──────────────────────────────────────────────────────

function PaymentTab({ overview }: { overview: BillingOverview }) {
  return (
    <div className="space-y-6 max-w-lg">
      <Alert className="border-warn-bg bg-warn-bg/40">
        <AlertTriangle className="h-4 w-4 text-warn-text" />
        <AlertDescription className="text-[13px] text-warn-text">
          Payment integration (Paystack / Stripe) is coming soon. To set up
          billing now,{" "}
          <a
            href="mailto:billing@yourbaas.com"
            className="font-semibold underline hover:no-underline"
          >
            contact our team
          </a>
          .
        </AlertDescription>
      </Alert>

      <div className="rounded-2xl border border-border bg-background p-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-4">
          Current payment method
        </p>

        {overview.paymentMethod === "none" ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface">
              <CreditCard className="h-6 w-6 text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                No payment method on file
              </p>
              <p className="text-[13px] text-text-muted mt-1">
                Add a card to upgrade to a paid plan.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-xl border border-border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
              <CreditCard className="h-4.5 w-4.5 text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary capitalize">
                {overview.cardBrand} ending in {overview.cardLast4}
              </p>
              <p className="text-[12px] text-text-muted">
                Billed via{" "}
                {overview.paymentMethod === "paystack" ? "Paystack" : "Stripe"}
              </p>
            </div>
            <button className="text-[12px] font-medium text-danger-text hover:underline">
              Remove
            </button>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3">
          <button
            disabled
            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-brand px-4 text-[13px] font-semibold text-white opacity-50 cursor-not-allowed"
          >
            <CreditCard className="h-4 w-4" />
            Add card via Paystack
          </button>
          <button
            disabled
            className="flex items-center justify-center gap-2 h-10 rounded-lg border border-border px-4 text-[13px] font-medium text-text-secondary opacity-50 cursor-not-allowed"
          >
            Add card via Stripe
          </button>
        </div>
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-border bg-background p-5 space-y-4">
        <p className="text-[13px] font-semibold text-text-primary">
          Billing FAQ
        </p>
        {[
          {
            q: "When am I charged?",
            a: "Invoices are generated on the 1st of each month for the prior period.",
          },
          {
            q: "What currency do you charge in?",
            a: "Nigerian Naira (₦) via Paystack for NGN accounts, and USD via Stripe for international customers.",
          },
          {
            q: "Can I downgrade?",
            a: "Yes — contact billing@yourbaas.com and your plan will be downgraded at the end of the current billing period.",
          },
        ].map((item) => (
          <div key={item.q}>
            <p className="text-[13px] font-medium text-text-primary">{item.q}</p>
            <p className="text-[12px] text-text-muted mt-0.5">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "plans", label: "Plans", icon: Layers },
  { id: "invoices", label: "Invoices", icon: Receipt },
  { id: "usage", label: "Usage", icon: Database },
  { id: "payment", label: "Payment", icon: CreditCard },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface BillingPageClientProps {
  userId: string;
  overview: BillingOverview;
  currentPlan: BillingPlan;
  invoices: Invoice[];
  usage: UsageSummary | null;
  allPlans: Record<PlanName, BillingPlan>;
  initialTab: string;
}

export function BillingPageClient({
  userId,
  overview,
  currentPlan,
  invoices,
  usage,
  allPlans,
  initialTab,
}: BillingPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<TabId>(
    (initialTab as TabId) || "overview",
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 sm:px-6 py-4 sm:py-5 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand/10">
          <CreditCard className="h-4 w-4 text-brand" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-medium text-text-primary">Billing</h1>
          <p className="text-sm text-text-secondary mt-0.5 hidden sm:block">
            Manage your plan, invoices, and payment method
          </p>
        </div>
        <PlanBadge plan={overview.currentPlan} />
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
                  isActive
                    ? "border-brand text-brand"
                    : "border-transparent text-text-secondary hover:text-text-primary hover:border-border2",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {activeTab === "overview" && (
            <OverviewTab
              overview={overview}
              currentPlan={currentPlan}
              usage={usage}
              userId={userId}
              onTabChange={handleTabChange}
            />
          )}
          {activeTab === "plans" && (
            <PlansTab currentPlan={currentPlan} allPlans={allPlans} />
          )}
          {activeTab === "invoices" && <InvoicesTab invoices={invoices} />}
          {activeTab === "usage" && (
            <UsageTab usage={usage} currentPlan={currentPlan} />
          )}
          {activeTab === "payment" && <PaymentTab overview={overview} />}
        </div>
      </div>
    </div>
  );
}