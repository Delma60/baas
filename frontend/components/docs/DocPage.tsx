// frontend/components/docs/DocPage.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  label: string;
  level?: 2 | 3;
}

interface DocPageProps {
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  toc?: TOCItem[];
  children: React.ReactNode;
}

export function DocPage({
  title,
  description,
  badge,
  badgeColor = "bg-info-bg text-info-text",
  toc,
  children,
}: DocPageProps) {
  return (
    <div className="flex gap-0 min-h-full">
      {/* Main */}
      <article className="flex-1 min-w-0 px-8 py-10 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          {badge && (
            <span
              className={cn(
                "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold mb-3",
                badgeColor,
              )}
            >
              {badge}
            </span>
          )}
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            {title}
          </h1>
          <p className="text-[15px] text-text-secondary leading-relaxed">
            {description}
          </p>
        </div>

        {/* Content */}
        <div className="prose-docs">{children}</div>
      </article>

      {/* TOC */}
      {toc && toc.length > 0 && (
        <aside className="hidden xl:block w-52 shrink-0 py-10 pr-6">
          <div className="sticky top-10">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">
              On this page
            </p>
            <div className="flex flex-col gap-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={cn(
                    "text-[12px] text-text-muted hover:text-text-primary transition-colors leading-snug",
                    item.level === 3 && "pl-3",
                  )}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

/* ─── Sub-components for doc content ─────────────────────── */

export function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-6">
      <h2 className="text-lg font-semibold text-text-primary mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function DocSubSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="mb-6 scroll-mt-6">
      <h3 className="text-[15px] font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function DocP({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] text-text-secondary leading-relaxed">
      {children}
    </p>
  );
}

export function DocCode({
  lang = "typescript",
  code,
  title,
}: {
  lang?: string;
  code: string;
  title?: string;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
          <span className="text-[12px] font-medium text-text-secondary">
            {title}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-mono text-text-muted">
            {lang}
          </span>
        </div>
      )}
      <pre className="bg-code-bg px-4 py-4 overflow-x-auto text-[13px] leading-relaxed">
        <code className="text-code-text font-mono">{code}</code>
      </pre>
    </div>
  );
}

export function DocTabs({
  tabs,
}: {
  tabs: { label: string; lang: string; code: string }[];
}) {
  return <DocTabsClient tabs={tabs} />;
}

// Client component for tabs
import { DocTabsClient } from "./DocTabsClient";

export function DocAlert({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "danger" | "success";
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-info-bg text-info-text border-info-text/20",
    warning: "bg-warn-bg text-warn-text border-warn-text/20",
    danger: "bg-danger-bg text-danger-text border-danger-text/20",
    success: "bg-success-bg text-success-text border-success-text/20",
  };
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 text-[13px] leading-relaxed",
        styles[type],
      )}
    >
      {children}
    </div>
  );
}

export function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border bg-surface">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-text-secondary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
