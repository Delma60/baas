// frontend/app/(marketing)/page.tsx
import Link from "next/link";
import {
  Database,
  Layers,
  HardDrive,
  ShieldCheck,
  Zap,
  Radio,
  Sparkles,
  ArrowRight,
  Check,
  Globe,
  Code2,
  BarChart3,
  Lock,
} from "lucide-react";

const PLANS = [
  {
    name: "Free",
    price_ngn: 0,
    price_usd: 0,
    features: [
      "50K SQL rows",
      "50K NoSQL documents",
      "1 GB storage",
      "100K edge function calls/mo",
      "Community support",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Starter",
    price_ngn: 15_000,
    price_usd: 10,
    features: [
      "500K SQL rows",
      "500K NoSQL documents",
      "10 GB storage",
      "1M edge function calls/mo",
      "3 team members",
      "Email support",
    ],
    cta: "Get started",
    highlight: true,
  },
  {
    name: "Pro",
    price_ngn: 45_000,
    price_usd: 30,
    features: [
      "Unlimited SQL rows",
      "Unlimited NoSQL docs",
      "100 GB storage",
      "Unlimited functions",
      "10 team members",
      "Priority support",
    ],
    cta: "Go Pro",
    highlight: false,
  },
];

const MODULES = [
  {
    icon: Database,
    name: "SQL Database",
    desc: "Full PostgreSQL with a clean REST API. No raw SQL required.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Layers,
    name: "NoSQL / KV",
    desc: "MongoDB document store and blazing-fast key-value store built in.",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: HardDrive,
    name: "Object Storage",
    desc: "Self-hosted MinIO with presigned URLs. No AWS bill surprises.",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    icon: ShieldCheck,
    name: "Auth",
    desc: "Email/password and social login with per-project JWTs.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Zap,
    name: "Edge Functions",
    desc: "Deploy custom logic without managing servers.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Radio,
    name: "Realtime",
    desc: "Postgres LISTEN/NOTIFY and MongoDB Change Streams out of the box.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Sparkles,
    name: "AI / Vectors",
    desc: "pgvector similarity search and OpenAI embeddings built in.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: BarChart3,
    name: "Usage & Billing",
    desc: "Flat-rate pricing. Track usage in real time, no meter surprises.",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
];

const CODE_SNIPPET = `import { BaasClient } from '@yourbaas/sdk'

const baas = new BaasClient({
  projectId: 'proj_abc123',
  apiKey: 'sk_anon_...',
})

// Query your SQL database
const { data } = await baas.db('posts')
  .select('id, title, created_at')
  .filter('status', 'eq', 'published')
  .order('created_at', 'desc')
  .limit(20)
  .execute()

// Or NoSQL — same API surface
const { data: docs } = await baas.nosql('articles')
  .find({ category: 'tech' })
  .limit(10)
  .execute()

// Realtime subscriptions
baas.realtime.on('posts', (event) => {
  console.log(event.type, event.record)
})`;

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-[--background] text-[--text-primary] font-sans">
      {/* ─── Nav ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[--border] bg-[--background]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <Database className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[--text-primary]">
              YourBaaS
            </span>
          </div>

          <div className="hidden items-center gap-8 text-sm font-medium text-[--text-secondary] md:flex">
            <Link
              href="#features"
              className="hover:text-[--text-primary] transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="hover:text-[--text-primary] transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              className="hover:text-[--text-primary] transition-colors"
            >
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-[--text-secondary] hover:text-[--text-primary] transition-colors md:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-24 md:pt-32">
        {/* Warm radial glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-start justify-center"
        >
          <div className="h-[600px] w-[900px] rounded-full bg-brand opacity-[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[--border] bg-[--surface] px-4 py-2 text-sm font-medium text-[--text-secondary]">
            <Globe className="h-4 w-4 text-[--brand]" />
            Africa-first · Open standards · Zero lock-in
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-[--text-primary] md:text-6xl lg:text-7xl">
            Backend infrastructure
            <br />
            <span className="text-[--brand]">
              that doesn&apos;t surprise you
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-8 text-[--text-secondary] md:text-xl">
            A developer-first BaaS platform with PostgreSQL, MongoDB, object
            storage, auth, realtime, and AI — all on flat-rate pricing with no
            per-operation charges.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="flex h-12 items-center gap-2 rounded-xl bg-brand px-8 text-base font-semibold text-white shadow-lg shadow-[--brand]/20 transition-all hover:bg-brand-hover hover:shadow-[--brand]/30"
            >
              Start building free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="flex h-12 items-center gap-2 rounded-xl border border-[--border] bg-[--surface] px-8 text-base font-semibold text-[--text-primary] transition-colors hover:bg-[--surface-hover]"
            >
              <Code2 className="h-4 w-4" />
              Read the docs
            </Link>
          </div>

          <p className="mt-6 text-sm text-[--text-muted]">
            No credit card required · Free tier forever
          </p>
        </div>
      </section>

      {/* ─── Code preview ─────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--code-bg] shadow-2xl">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-[--border] px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-400/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
              <div className="h-3 w-3 rounded-full bg-green-400/80" />
              <span className="ml-3 text-xs font-medium text-[--text-muted]">
                app/lib/baas.ts
              </span>
            </div>
            <pre className="overflow-x-auto p-6 text-sm leading-7 text-[--code-text]">
              <code>{CODE_SNIPPET}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ─── Features grid ────────────────────────────────────────────── */}
      <section id="features" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[--text-primary] md:text-4xl">
              Everything your backend needs
            </h2>
            <p className="mx-auto max-w-xl text-[--text-secondary]">
              Eight modules. One SDK. One flat price. No stitching together a
              dozen services.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.name}
                  className="group rounded-xl border border-[--border] bg-[--surface] p-5 transition-all hover:border-[--brand]/30 hover:shadow-md"
                >
                  <div
                    className={`mb-4 inline-flex rounded-lg p-2.5 ${mod.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${mod.color}`} />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-[--text-primary]">
                    {mod.name}
                  </h3>
                  <p className="text-sm leading-6 text-[--text-secondary]">
                    {mod.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Why section ──────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max w-6xl max-w-6xl">
          <div className="overflow-hidden rounded-2xl border border-[--border] bg-[--surface]">
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[--border]">
              {[
                {
                  icon: Lock,
                  title: "Zero vendor lock-in",
                  desc: "Open protocols, portable data, self-hostable. Your data lives in standard PostgreSQL and MongoDB — export it any time.",
                },
                {
                  icon: Globe,
                  title: "Africa-first infrastructure",
                  desc: "Naira pricing, low-latency Nigerian regions, and NDPR/GDPR compliance built in. Built for the world, optimised for Africa.",
                },
                {
                  icon: BarChart3,
                  title: "Predictable flat-rate pricing",
                  desc: "No per-operation charges, no surprise bills. Pick a plan, know your cost. Period.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="p-8">
                    <div className="mb-4 inline-flex rounded-lg bg-brand/10 p-2.5">
                      <Icon className="h-5 w-5 text-[--brand]" />
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-[--text-primary]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-6 text-[--text-secondary]">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SDK callout ──────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-[--border] bg-[--surface] p-10 md:p-14 text-center">
            <h2 className="mb-4 text-2xl font-bold text-[--text-primary] md:text-3xl">
              One SDK. Two languages. Same API.
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-[--text-secondary]">
              Install the JavaScript/TypeScript SDK or the Python SDK —
              identical method names, identical options, identical behaviour.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {[
                {
                  label: "npm install @yourbaas/sdk",
                  lang: "JavaScript / TypeScript",
                },
                { label: "pip install yourbaas", lang: "Python" },
              ].map((s) => (
                <div
                  key={s.lang}
                  className="flex flex-col items-start gap-1 rounded-xl border border-[--border] bg-[--code-bg] px-6 py-4 text-left"
                >
                  <span className="text-xs font-medium text-[--text-muted]">
                    {s.lang}
                  </span>
                  <code className="font-mono text-sm text-[--code-text]">
                    {s.label}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[--text-primary] md:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="text-[--text-secondary]">
              Flat-rate plans. No per-operation charges. Priced for Nigeria and
              the world.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlight
                    ? "border-[--brand] bg-brand/5 shadow-lg shadow-[--brand]/10"
                    : "border-[--border] bg-[--surface]"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-brand px-4 py-1 text-xs font-bold text-white">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="mb-1 text-lg font-bold text-[--text-primary]">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[--text-primary]">
                      {plan.price_ngn === 0
                        ? "Free"
                        : `₦${plan.price_ngn.toLocaleString()}`}
                    </span>
                    {plan.price_ngn > 0 && (
                      <span className="text-sm text-[--text-muted]">
                        /mo · ${plan.price_usd} USD
                      </span>
                    )}
                  </div>
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-[--text-secondary]"
                    >
                      <Check className="h-4 w-4 flex-shrink-0 text-[--brand]" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? "bg-brand text-white hover:bg-brand-hover"
                      : "border border-[--border] bg-[--background] text-[--text-primary] hover:bg-[--surface-hover]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-brand px-8 py-16 text-center shadow-2xl shadow-[--brand]/20">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Ready to build?
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-white/80">
            Spin up your project in under 60 seconds. No credit card, no infra
            to configure.
          </p>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-base font-bold text-[--brand] shadow-lg transition-all hover:bg-orange-50"
          >
            Start building — it&apos;s free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-[--border] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
                <Database className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-[--text-primary]">YourBaaS</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[--text-muted]">
              <Link
                href="/docs"
                className="hover:text-[--text-primary] transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/pricing"
                className="hover:text-[--text-primary] transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                className="hover:text-[--text-primary] transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/status"
                className="hover:text-[--text-primary] transition-colors"
              >
                Status
              </Link>
              <Link
                href="/privacy"
                className="hover:text-[--text-primary] transition-colors"
              >
                Privacy
              </Link>
            </div>

            <p className="text-sm text-[--text-muted]">
              © {new Date().getFullYear()} YourBaaS. Built in Lagos 🇳🇬
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
