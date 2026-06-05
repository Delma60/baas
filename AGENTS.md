# AGENTS.md — BaaS Platform (Next.js + FastAPI + SDK)

> **This file is the source of truth** for AI agents, LLMs, and contributors working on this codebase.
> Read this entire document before writing, editing, or deleting any code.
> When in doubt, re-read this file. Do not guess.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design System & Theme](#2-design-system--theme)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables](#4-environment-variables)
5. [Core Architecture & Data Flow](#5-core-architecture--data-flow)
6. [Database Schema — Platform Tables](#6-database-schema--platform-tables)
7. [API Design Standards](#7-api-design-standards)
8. [Feature Modules](#8-feature-modules)
9. [SDK — JavaScript/TypeScript & Python](#9-sdk--javascripttypescript--python)
10. [Superadmin & RBAC](#10-superadmin--rbac)
11. [Pricing Plans](#11-pricing-plans)
12. [Middleware & Security](#12-middleware--security)
13. [Development Workflow](#13-development-workflow)
14. [Coding Conventions for Agents](#14-coding-conventions-for-agents)
15. [Testing Strategy](#15-testing-strategy)
16. [Deployment](#16-deployment)
17. [Roadmap & Priorities](#17-roadmap--priorities)
18. [Do Not Do — Agent Rules](#18-do-not-do--agent-rules)

---

## 1. Project Overview

**What we're building:** A next-generation Backend-as-a-Service (BaaS) platform — a developer-first
infrastructure product that competes with Firebase and Supabase. Visually and experientially inspired
by Firebase's clean, warm console UI — built on open standards with zero vendor lock-in.

**Core pillars:**
- Zero vendor lock-in (open protocols, portable data, self-hostable)
- Predictable flat-rate pricing — no per-operation charges, no surprise bills
- AI-native infrastructure (vector storage, MCP support, agent-friendly APIs)
- Africa/Global-first — Nigerian Naira pricing, low-latency African regions, NDPR/GDPR compliant
- **Dual database support** — PostgreSQL (SQL/relational) + MongoDB (NoSQL: document + key-value)
- **Self-hosted object storage** via MinIO — no AWS, no GCP, no vendor dependency
- **First-class SDKs** — JavaScript/TypeScript (npm) + Python (pip), same API surface
- **Superadmin panel** with staff RBAC — manage the platform without touching the DB
- Visual permission editor — no raw SQL/RLS or MongoDB query syntax required ever

**Target users:** Indie developers, startups, and engineering teams frustrated with Firebase's pricing
surprises and Supabase's steep learning curve.

**Three services — one monorepo:**

| # | Service | Path | Technology | Purpose |
|---|---------|------|-----------|---------|
| 1 | `frontend` | `/frontend` | Next.js 15 | Dashboard UI, platform auth, superadmin, billing |
| 2 | `backend` | `/backend` | FastAPI (Python 3.12) | All BaaS engine logic, public `/v1/` API |
| 3 | `sdk` | `/sdk` | TypeScript + Python | Client libraries developers install in their apps |

**Architecture overview:**

```
┌──────────────────────────────────────────────────────┐
│              Next.js 15 (App Router)                 │
│  /dashboard/*      → developer console               │
│  /superadmin/*     → staff-only panel (RBAC-gated)   │
│  /api/internal/*   → session-gated proxy to FastAPI  │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP + X-Internal-Secret
                       ▼
┌──────────────────────────────────────────────────────┐
│              FastAPI (Python 3.12)                   │
│  /v1/*             → public API (SDK-consumed)       │
│  /internal/*       → dashboard proxy endpoints       │
│  /superadmin/*     → staff API (staff JWT-gated)     │
│  Runs at :8000, internal network only                │
└──────┬───────────┬──────────┬────────────────────────┘
       │           │          │
  PostgreSQL   MongoDB     MinIO
  (SQL data)   (NoSQL)    (Files)
  + pgvector   doc + kv   self-hosted

           consumed by ↓

┌──────────────────────────────────────────────────────┐
│                    SDK (service 3)                   │
│  sdk/js/    → @yourbaas/sdk  (npm, TypeScript)       │
│  sdk/python/→ yourbaas       (pip, Python 3.9+)      │
│  Both wrap /v1/* FastAPI endpoints identically       │
└──────────────────────────────────────────────────────┘
```

**Tech stack:**

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | Server components by default |
| Frontend language | TypeScript 5 (strict) | No `any`, ever |
| Backend framework | FastAPI (Python 3.12) | All BaaS engine + superadmin API |
| Backend language | Python 3.12 (strict typing) | Pydantic v2 models throughout |
| SQL database | PostgreSQL 16 + pgvector | Via SQLAlchemy 2 + Alembic |
| NoSQL database | MongoDB 7 | Via Motor (async) — document + key-value |
| Platform DB ORM | Drizzle ORM (Next.js side) | Platform tables only (users, orgs, billing) |
| Object storage | MinIO (self-hosted) | S3-compatible; boto3 on Python side |
| Auth (platform) | Auth.js v5 (NextAuth) | Developer + staff login |
| Auth (superadmin) | Separate staff JWT | Issued by FastAPI, verified per request |
| Styling | Tailwind CSS v4 + shadcn/ui | Firebase-inspired theme (see §2) |
| State | Zustand + TanStack Query v5 | Client + server state |
| Realtime | Postgres LISTEN/NOTIFY + Socket.io | |
| Jobs (Next.js) | BullMQ + Redis (ioredis) | Background processing |
| Jobs (Python) | Celery + Redis | Background jobs on Python side |
| Email | Nodemailer | Transactional only |
| Payments | Paystack (primary) + Stripe (secondary) | Dual-currency |
| SDK (JS/TS) | TypeScript, built with tsup | Published to npm |
| SDK (Python) | Python 3.9+, built with hatch | Published to PyPI |
| Testing (TS) | Vitest + Playwright | Unit + E2E |
| Testing (Python) | pytest + httpx | Unit + integration |
| Deployment | Docker Compose + Coolify or Vercel+Fly.io | |

---

## 2. Design System & Theme

> Mandatory reading before touching any UI file.
> Firebase Console-inspired — warm, approachable, high-contrast dark mode with amber/orange accents.
> The superadmin panel uses the same design system with a subtle red accent override to signal
> the elevated context.

### 2.1 Brand Identity

**Personality:** Warm, fast, trustworthy, developer-native. Like Firebase but yours — open, honest, African.

**Do:** Clean layouts. Generous whitespace. Subtle animations. Code that feels at home.
**Don't:** Cold blues, sterile greys, enterprise-grey monotony, heavy drop shadows.

**Superadmin accent:** The `/superadmin` shell replaces `--brand` with `--admin-brand` (#dc2626 red)
on active sidebar items and CTAs only. Everything else (surfaces, typography, layout) is identical
to the developer dashboard. This gives staff a clear visual signal they are in an elevated context
without a completely different design language.

---

### 2.2 Color Palette

Define in `tailwind.config.ts` and `app/globals.css`.

```typescript
// tailwind.config.ts
colors: {
  brand: {
    50:  '#fff8f0',
    100: '#ffecd3',
    200: '#ffd4a0',
    300: '#ffb563',
    400: '#ff9130',   // ← Primary CTA
    500: '#f97316',   // ← Hover
    600: '#ea6c00',   // ← Active/pressed
    700: '#c45200',
    800: '#9a3f00',
    900: '#7c3300',
  },
  // Superadmin accent — red signals elevated context
  admin: {
    50:  '#fef2f2',
    100: '#fee2e2',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',   // ← Admin active sidebar / CTA
    700: '#b91c1c',
    900: '#7f1d1d',
  },
  surface: {
    50:  '#f8f9fa',
    100: '#f1f3f4',
    200: '#e8eaed',
    300: '#dadce0',
    400: '#bdc1c6',
    500: '#80868b',
    600: '#5f6368',
    700: '#3c4043',
    800: '#2d2f31',
    900: '#202124',
    950: '#17181a',
  },
  success: { DEFAULT: '#34a853', light: '#e6f4ea', dark: '#1e7e34' },
  warning: { DEFAULT: '#fbbc04', light: '#fef9e7', dark: '#f09300' },
  danger:  { DEFAULT: '#ea4335', light: '#fce8e6', dark: '#c5221f' },
  info:    { DEFAULT: '#4285f4', light: '#e8f0fe', dark: '#1a73e8' },
}
```

```css
/* app/globals.css */
:root {
  --brand:              #ff9130;
  --brand-hover:        #f97316;
  --brand-foreground:   #ffffff;

  /* Superadmin — only active in /superadmin shell */
  --admin-brand:        #dc2626;
  --admin-brand-hover:  #b91c1c;
  --admin-sidebar-active:      #fee2e2;
  --admin-sidebar-active-text: #b91c1c;

  --background:      #ffffff;
  --foreground:      #202124;
  --surface:         #f8f9fa;
  --surface-hover:   #f1f3f4;
  --border:          #e8eaed;
  --border-subtle:   #f1f3f4;

  --sidebar-bg:           #f1f3f4;
  --sidebar-active:       #ffecd3;
  --sidebar-active-text:  #ea6c00;
  --sidebar-text:         #3c4043;
  --sidebar-icon:         #5f6368;

  --text-primary:    #202124;
  --text-secondary:  #5f6368;
  --text-muted:      #80868b;
  --text-inverse:    #ffffff;

  --code-bg:         #f8f9fa;
  --code-border:     #e8eaed;
  --code-text:       #202124;
}

.dark {
  --background:      #202124;
  --foreground:      #e8eaed;
  --surface:         #2d2f31;
  --surface-hover:   #3c4043;
  --border:          #3c4043;
  --border-subtle:   #2d2f31;

  --sidebar-bg:           #17181a;
  --sidebar-active:       #3a2a1a;
  --sidebar-active-text:  #ffb563;
  --sidebar-text:         #e8eaed;
  --sidebar-icon:         #9aa0a6;

  --admin-sidebar-active:      #3b1c1c;
  --admin-sidebar-active-text: #f87171;

  --text-primary:    #e8eaed;
  --text-secondary:  #9aa0a6;
  --text-muted:      #5f6368;

  --code-bg:         #17181a;
  --code-border:     #3c4043;
  --code-text:       #e8eaed;
}
```

---

### 2.3 Typography

```typescript
fontFamily: {
  sans: ['Google Sans', 'Inter', 'system-ui', 'sans-serif'],
  mono: ['Roboto Mono', 'JetBrains Mono', 'monospace'],
}
```

| Token | Size | Weight | Use |
|---|---|---|---|
| `text-xs` | 12px | 400 | Captions, labels, timestamps |
| `text-sm` | 14px | 400/500 | Body, table rows, secondary |
| `text-base` | 16px | 400 | Default prose |
| `text-lg` | 18px | 600 | Section headings |
| `text-xl` | 20px | 700 | Page titles |
| `text-2xl` | 24px | 700 | Dashboard section headers |
| `text-3xl+` | 30px+ | 800 | Marketing / hero only |

---

### 2.4 Spacing & Layout

```
Dashboard shell:    sidebar 256px wide (collapsed: 64px icon-only)
Content area:       max-w-5xl centered, px-6 py-8
Cards:              rounded-xl, border border-[--border], bg-[--surface], p-5
Table rows:         h-12 (48px), px-4
Buttons:            h-9 (36px) default, h-8 (32px) small, h-11 (44px) large
Input fields:       h-9, rounded-lg, border
Sidebar items:      h-10, rounded-lg, px-3, gap-3 icon + label
```

---

### 2.5 Component Patterns

#### Sidebar Item (developer dashboard)

```tsx
<Link href={href} className={cn(
  'flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors',
  isActive
    ? 'bg-[--sidebar-active] text-[--sidebar-active-text]'
    : 'text-[--sidebar-text] hover:bg-[--surface-hover]'
)}>
  <Icon className={cn('h-4 w-4', isActive ? 'text-[--brand]' : 'text-[--sidebar-icon]')} />
  {label}
</Link>
```

#### Sidebar Item (superadmin — swap brand for admin-brand)

```tsx
<Link href={href} className={cn(
  'flex items-center gap-3 h-10 px-3 rounded-lg text-sm font-medium transition-colors',
  isActive
    ? 'bg-[--admin-sidebar-active] text-[--admin-sidebar-active-text]'
    : 'text-[--sidebar-text] hover:bg-[--surface-hover]'
)}>
  <Icon className={cn('h-4 w-4', isActive ? 'text-[--admin-brand]' : 'text-[--sidebar-icon]')} />
  {label}
</Link>
```

#### Staff Role Badge

```tsx
const staffRoleVariants = {
  super_admin: 'bg-danger/10 text-danger border-danger/20',
  support:     'bg-info/10 text-info border-info/20',
  billing:     'bg-warning/10 text-warning border-warning/20',
  ops:         'bg-success/10 text-success border-success/20',
}

<span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', staffRoleVariants[role])}>
  {role.replace('_', ' ')}
</span>
```

#### Database Mode Badge

```tsx
const dbModeVariants = {
  sql:      'bg-info/10 text-info border-info/20',
  document: 'bg-success/10 text-success border-success/20',
  keyvalue: 'bg-warning/10 text-warning border-warning/20',
}
```

#### Metric / Stat Card

```tsx
<div className="rounded-xl border border-[--border] bg-[--surface] p-5">
  <p className="text-sm text-[--text-secondary] font-medium">{label}</p>
  <p className="text-2xl font-bold text-[--text-primary] mt-1">{value}</p>
  <p className="text-xs text-[--text-muted] mt-1">{subtext}</p>
</div>
```

---

### 2.6 Icons

Lucide React exclusively. No other icon libraries.

```typescript
const MODULE_ICONS = {
  overview:    LayoutDashboard,
  database:    Database,
  nosql:       Layers,
  storage:     HardDrive,
  auth:        ShieldCheck,
  functions:   Zap,
  realtime:    Radio,
  ai:          Sparkles,
  logs:        ScrollText,
  settings:    Settings,
  billing:     CreditCard,
  usage:       BarChart3,
  members:     Users,
  apiKeys:     KeyRound,
  // Superadmin
  adminUsers:  UserCog,
  adminOrgs:   Building2,
  adminPlans:  Package,
  adminAudit:  ClipboardList,
  adminStaff:  ShieldAlert,
  adminFlags:  Flag,
}
```

---

### 2.7 Dark Mode

```tsx
// app/layout.tsx — prevent FOUC
<script dangerouslySetInnerHTML={{__html: `
  const t = localStorage.getItem('theme') || 'system';
  const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
`}} />
```

**Rule:** Every color must use CSS variables. Never hardcode Tailwind color classes.

---

### 2.8 Animation & Motion

```typescript
animation: {
  'fade-in':    'fadeIn 150ms ease-out',
  'slide-down': 'slideDown 150ms ease-out',
  'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
}
```

`transition-colors duration-150` on all interactive elements. Never `duration-300+` inside the dashboard.

---

## 3. Repository Structure

```
/                                    ← Monorepo root
├── AGENTS.md
├── README.md
├── docker-compose.yml
├── .env.example
│
├── frontend/                        ← Service 1: Next.js 15
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   │
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   │
│   │   ├── (marketing)/
│   │   │   ├── page.tsx             ← Landing
│   │   │   └── pricing/page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── verify/page.tsx
│   │   │
│   │   ├── (dashboard)/             ← Developer console
│   │   │   ├── layout.tsx           ← Sidebar + TopNav (brand orange)
│   │   │   ├── page.tsx             ← Project list
│   │   │   └── projects/[projectId]/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── database/        ← SQL (PostgreSQL)
│   │   │       ├── nosql/           ← NoSQL (MongoDB)
│   │   │       │   ├── page.tsx
│   │   │       │   ├── collections/[collectionId]/page.tsx
│   │   │       │   └── keyvalue/page.tsx
│   │   │       ├── storage/         ← MinIO
│   │   │       ├── auth/
│   │   │       ├── functions/
│   │   │       ├── realtime/page.tsx
│   │   │       ├── ai/page.tsx
│   │   │       ├── logs/page.tsx
│   │   │       ├── usage/page.tsx
│   │   │       └── settings/
│   │   │           ├── api-keys/page.tsx
│   │   │           └── billing/page.tsx
│   │   │
│   │   ├── (superadmin)/            ← Staff-only panel (red accent)
│   │   │   ├── layout.tsx           ← Superadmin shell — RBAC gate here
│   │   │   ├── page.tsx             ← Platform-wide metrics dashboard
│   │   │   ├── users/
│   │   │   │   ├── page.tsx         ← All developer accounts
│   │   │   │   └── [userId]/page.tsx
│   │   │   ├── organizations/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [orgId]/page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [projectId]/page.tsx
│   │   │   ├── billing/
│   │   │   │   ├── page.tsx         ← Revenue, subscriptions, invoices
│   │   │   │   └── [orgId]/page.tsx
│   │   │   ├── staff/
│   │   │   │   ├── page.tsx         ← Staff accounts + role assignments
│   │   │   │   └── invite/page.tsx
│   │   │   ├── audit/page.tsx       ← Platform-wide audit log
│   │   │   └── flags/page.tsx       ← Feature flags
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       └── internal/            ← Session-gated proxy to FastAPI
│   │           ├── projects/route.ts
│   │           ├── usage/[projectId]/route.ts
│   │           ├── billing/route.ts
│   │           └── superadmin/      ← Staff-session-gated proxy
│   │               ├── users/route.ts
│   │               ├── orgs/route.ts
│   │               ├── staff/route.ts
│   │               └── audit/route.ts
│   │
│   ├── components/
│   │   ├── ui/                      ← shadcn/ui — never edit manually
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          ← Accepts `variant: 'dashboard' | 'superadmin'`
│   │   │   ├── TopNav.tsx
│   │   │   ├── ProjectSwitcher.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── dashboard/
│   │   ├── nosql/
│   │   │   ├── CollectionExplorer.tsx
│   │   │   ├── DocumentEditor.tsx
│   │   │   ├── KeyValueEditor.tsx
│   │   │   └── QueryBuilder.tsx
│   │   ├── storage/
│   │   ├── superadmin/
│   │   │   ├── PlatformMetrics.tsx
│   │   │   ├── UserTable.tsx
│   │   │   ├── OrgTable.tsx
│   │   │   ├── StaffTable.tsx
│   │   │   ├── StaffRoleBadge.tsx
│   │   │   ├── AuditLogTable.tsx
│   │   │   └── ImpersonateButton.tsx   ← super_admin role only
│   │   └── shared/
│   │       ├── ApiKeyDisplay.tsx
│   │       ├── CopyButton.tsx
│   │       ├── EmptyState.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── DbModeBadge.tsx
│   │       └── PageHeader.tsx
│   │
│   ├── lib/
│   │   ├── db/                      ← Drizzle — platform tables only
│   │   │   └── schema/
│   │   │       ├── users.ts
│   │   │       ├── organizations.ts
│   │   │       ├── projects.ts
│   │   │       ├── api-keys.ts
│   │   │       ├── usage-records.ts
│   │   │       ├── audit-logs.ts
│   │   │       └── staff.ts         ← Staff accounts + roles
│   │   ├── api/
│   │   │   ├── client.ts            ← Typed fetch wrapper → FastAPI
│   │   │   ├── superadmin-client.ts ← Staff-JWT-bearing fetch wrapper
│   │   │   ├── response.ts
│   │   │   └── errors.ts
│   │   ├── auth/
│   │   │   ├── config.ts
│   │   │   ├── session.ts
│   │   │   └── superadmin-guard.ts  ← withStaffRole() HOC + hook
│   │   └── utils/
│   │
│   ├── hooks/
│   │   ├── use-project.ts
│   │   ├── use-session.ts
│   │   ├── use-staff-session.ts     ← reads staff role from session
│   │   └── use-theme.ts
│   │
│   ├── stores/
│   │   ├── project-store.ts
│   │   └── ui-store.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── api.ts
│   │   ├── staff.ts                 ← StaffRole, StaffUser, StaffPermission
│   │   └── baas.ts
│   │
│   └── config/
│       ├── site.ts
│       ├── plans.ts
│       ├── regions.ts
│       ├── theme.ts
│       └── staff-permissions.ts     ← Permission matrix per role
│
├── backend/                         ← Service 2: FastAPI (Python 3.12)
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── Dockerfile
│   │
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py                ← pydantic-settings
│   │   ├── dependencies.py
│   │   │
│   │   ├── api/
│   │   │   ├── router.py            ← Mounts v1, internal, superadmin routers
│   │   │   ├── v1/
│   │   │   │   ├── db/router.py     ← SQL REST
│   │   │   │   ├── nosql/router.py  ← MongoDB document + kv
│   │   │   │   ├── storage/router.py← MinIO
│   │   │   │   ├── auth/router.py
│   │   │   │   ├── realtime/router.py
│   │   │   │   ├── functions/router.py
│   │   │   │   └── ai/router.py
│   │   │   ├── internal/            ← X-Internal-Secret gated
│   │   │   │   └── router.py
│   │   │   └── superadmin/          ← Staff JWT gated
│   │   │       ├── router.py        ← Mounts all superadmin sub-routers
│   │   │       ├── users.py
│   │   │       ├── organizations.py
│   │   │       ├── projects.py
│   │   │       ├── billing.py
│   │   │       ├── staff.py         ← Manage staff accounts + roles
│   │   │       ├── audit.py
│   │   │       └── flags.py
│   │   │
│   │   ├── engines/
│   │   │   ├── query_engine.py
│   │   │   ├── nosql_engine.py
│   │   │   ├── permission_engine.py
│   │   │   ├── storage_engine.py
│   │   │   ├── realtime_engine.py
│   │   │   ├── function_runner.py
│   │   │   └── vector_engine.py
│   │   │
│   │   ├── provisioner/
│   │   │   ├── sql_provisioner.py
│   │   │   └── nosql_provisioner.py
│   │   │
│   │   ├── models/
│   │   │   ├── requests.py
│   │   │   ├── responses.py
│   │   │   ├── permissions.py
│   │   │   └── staff.py             ← StaffRole enum, StaffContext model
│   │   │
│   │   ├── db/
│   │   │   ├── postgres.py
│   │   │   ├── mongo.py
│   │   │   └── redis.py
│   │   │
│   │   ├── storage/
│   │   │   └── minio.py
│   │   │
│   │   ├── auth/
│   │   │   ├── project_auth.py      ← Per-project user JWTs
│   │   │   └── staff_auth.py        ← Staff JWT issue + verify
│   │   │
│   │   ├── middleware/
│   │   │   ├── api_key.py
│   │   │   ├── rate_limit.py
│   │   │   └── staff_auth.py        ← FastAPI dep: require_staff_role(...)
│   │   │
│   │   └── tasks/
│   │       ├── celery_app.py
│   │       ├── usage_sync.py
│   │       └── invoice_gen.py
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   └── tests/
│       ├── unit/
│       │   ├── test_query_engine.py
│       │   ├── test_nosql_engine.py
│       │   └── test_permission_engine.py
│       └── integration/
│           ├── test_db_api.py
│           ├── test_nosql_api.py
│           ├── test_storage_api.py
│           └── test_superadmin_api.py
│
└── sdk/                             ← Service 3: Client SDKs
    ├── README.md
    │
    ├── js/                          ← @yourbaas/sdk (npm)
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── tsup.config.ts
    │   ├── src/
    │   │   ├── index.ts             ← Re-exports everything
    │   │   ├── client.ts            ← BaasClient class (main entry point)
    │   │   ├── modules/
    │   │   │   ├── database.ts      ← .db() — SQL REST wrapper
    │   │   │   ├── nosql.ts         ← .nosql() — MongoDB wrapper
    │   │   │   ├── kv.ts            ← .kv() — key-value wrapper
    │   │   │   ├── storage.ts       ← .storage() — MinIO presigned uploads
    │   │   │   ├── auth.ts          ← .auth() — signup/login/session
    │   │   │   ├── realtime.ts      ← .realtime() — subscriptions
    │   │   │   └── functions.ts     ← .functions() — edge function calls
    │   │   ├── types/
    │   │   │   ├── index.ts
    │   │   │   └── filters.ts       ← QueryFilter, NoSQLFilter, KVOptions
    │   │   └── utils/
    │   │       ├── fetch.ts         ← Base fetch with auth headers
    │   │       └── errors.ts        ← BaasError class
    │   └── tests/
    │       └── *.test.ts            ← Vitest
    │
    └── python/                      ← yourbaas (pip)
        ├── pyproject.toml
        ├── src/
        │   └── yourbaas/
        │       ├── __init__.py      ← Re-exports BaasClient
        │       ├── client.py        ← BaasClient class (mirrors JS API)
        │       ├── modules/
        │       │   ├── database.py
        │       │   ├── nosql.py
        │       │   ├── kv.py
        │       │   ├── storage.py
        │       │   ├── auth.py
        │       │   ├── realtime.py
        │       │   └── functions.py
        │       ├── types/
        │       │   ├── __init__.py
        │       │   └── filters.py
        │       └── utils/
        │           ├── http.py      ← httpx async client wrapper
        │           └── errors.py    ← BaasError exception
        └── tests/
            └── test_*.py            ← pytest
```

---

## 4. Environment Variables

Single `.env` file shared across all services via Docker Compose.

```env
# ─── App ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=YourBaaS
NODE_ENV=development

# FastAPI base URL (Next.js → FastAPI internal calls only)
FASTAPI_BASE_URL=http://backend:8000
INTERNAL_API_SECRET=          # Random string, never exposed to clients

# ─── PostgreSQL ───────────────────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/baas_platform
DATABASE_SYNC_URL=postgresql://postgres:postgres@postgres:5432/baas_platform

# ─── MongoDB ──────────────────────────────────────────────────────────────────
MONGODB_URL=mongodb://mongo:27017
MONGODB_DB_NAME=baas_platform

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL=redis://redis:6379

# ─── MinIO ────────────────────────────────────────────────────────────────────
MINIO_ENDPOINT=minio:9000
MINIO_PUBLIC_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# ─── Auth.js (platform login) ─────────────────────────────────────────────────
AUTH_SECRET=                  # openssl rand -base64 32
AUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# ─── Superadmin ───────────────────────────────────────────────────────────────
STAFF_JWT_SECRET=             # Separate secret — never share with AUTH_SECRET
STAFF_JWT_EXPIRY=28800        # 8 hours in seconds
# Initial super_admin bootstrapped on first run (see §10.4)
BOOTSTRAP_ADMIN_EMAIL=
BOOTSTRAP_ADMIN_PASSWORD=

# ─── Email ────────────────────────────────────────────────────────────────────
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false

# ─── Payments ─────────────────────────────────────────────────────────────────
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_WEBHOOK_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# ─── AI / Embeddings ──────────────────────────────────────────────────────────
OPENAI_API_KEY=

# ─── Internal Secrets ─────────────────────────────────────────────────────────
API_KEY_ENCRYPTION_SECRET=
JWT_SECRET=                   # Per-project user JWTs
```

---

## 5. Core Architecture & Data Flow

### 5.1 Three Services, Clear Boundaries

| Service | Owns | Never does |
|---------|------|------------|
| `frontend` | Dashboard UI, platform auth, billing webhooks, superadmin UI | BaaS engine logic, direct DB queries on project data |
| `backend` | BaaS API, engines, permissions, superadmin API | Rendering HTML, serving static assets |
| `sdk` | Client library code, types, tests | Making backend decisions, containing business logic |

### 5.2 Multi-tenancy

**SQL (PostgreSQL):** one schema per project (`proj_{id}`).
**NoSQL (MongoDB):** one database per project (`proj_{id}`).
**Storage (MinIO):** bucket names prefixed `{projectId}-{bucketName}`.

### 5.3 Public API Request Flow

```
Client SDK
  → POST /v1/db/{projectId}/posts
  │
  ├── Reverse proxy (Caddy) → FastAPI :8000
  ├── middleware: api_key.py validates Bearer token
  │              rate_limit.py applies sliding window
  ├── router validates projectId matches key
  ├── engines/query_engine.py or nosql_engine.py
  │   ├── permission_engine.evaluate(...)
  │   └── executes parameterized query
  └── → { data: [...], meta: { count } }
```

### 5.4 Dashboard → FastAPI Flow

```
Browser (authenticated session)
  → Next.js Server Component
  → lib/api/client.ts
  → fetch(FASTAPI_BASE_URL + '/internal/...', {
      headers: { 'X-Internal-Secret': INTERNAL_API_SECRET }
    })
  → FastAPI /internal/* (validates secret header)
```

### 5.5 Superadmin Request Flow

```
Browser (staff session)
  → Next.js (superadmin) layout.tsx checks staff role via withStaffRole()
  → lib/api/superadmin-client.ts
  → fetch(FASTAPI_BASE_URL + '/superadmin/...', {
      headers: {
        'X-Internal-Secret': INTERNAL_API_SECRET,
        'X-Staff-Token': staffJwt          ← issued at staff login
      }
    })
  → FastAPI /superadmin/* middleware:
      1. Validates X-Internal-Secret (caller is Next.js, not public)
      2. Decodes X-Staff-Token → StaffContext { id, role, permissions }
      3. require_staff_role(role) dependency enforces per-route permissions
  → superadmin engine / direct DB query
```

### 5.6 Permission Engine

Same JSON rule format for SQL and NoSQL — see §8.

---

## 6. Database Schema — Platform Tables

These live in the PostgreSQL `public` schema. Managed by Drizzle on the Next.js side for reads,
and SQLAlchemy/Alembic on the Python side for migrations.

```typescript
// frontend/lib/db/schema/projects.ts
export const projects = pgTable('projects', {
  id:             text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  name:           text('name').notNull(),
  slug:           text('slug').notNull(),
  region:         text('region').default('us-east-1'),
  status:         text('status', { enum: ['active','paused','deleted'] }).default('active'),
  dbSchema:       text('db_schema').notNull(),       // "proj_abc123" — PostgreSQL schema
  mongoDatabase:  text('mongo_database').notNull(),  // "proj_abc123" — MongoDB database
  authJwtSecret:  text('auth_jwt_secret').notNull(),
  createdAt:      timestamp('created_at').defaultNow(),
})

// frontend/lib/db/schema/staff.ts
export const staff = pgTable('staff', {
  id:             text('id').primaryKey().$defaultFn(() => createId()),
  email:          text('email').notNull().unique(),
  name:           text('name').notNull(),
  hashedPassword: text('hashed_password').notNull(),
  role:           text('role', {
                    enum: ['super_admin', 'support', 'billing', 'ops']
                  }).notNull(),
  isActive:       boolean('is_active').default(true),
  invitedBy:      text('invited_by'),              // staff.id who invited this person
  lastLoginAt:    timestamp('last_login_at'),
  createdAt:      timestamp('created_at').defaultNow(),
  updatedAt:      timestamp('updated_at').defaultNow(),
})
```

All other platform tables (users, organizations, api_keys, usage_records, audit_logs) follow the
same structure as standard BaaS platform tables, with `mongoDatabase` added to `projects` and
`staff` added as a new table.

---

## 7. API Design Standards

### 7.1 Response Envelope

```python
# Success
{ "data": T | list[T], "meta": { "count": int, "page": int, "limit": int } }

# Error
{ "error": { "code": "PERMISSION_DENIED", "message": "Human readable.", "details": {} } }
```

### 7.2 SQL Database Endpoints (`/v1/db/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/db/{projectId}/{table}` | List rows |
| GET | `/v1/db/{projectId}/{table}/{id}` | Single row |
| POST | `/v1/db/{projectId}/{table}` | Insert row(s) |
| PATCH | `/v1/db/{projectId}/{table}/{id}` | Update row |
| DELETE | `/v1/db/{projectId}/{table}/{id}` | Delete row |
| POST | `/v1/db/{projectId}/rpc/{fn}` | Call DB function |

Query params: `?select=`, `?filter=`, `?order=`, `?limit=`, `?offset=`, `?include=`

### 7.3 NoSQL Document Endpoints (`/v1/nosql/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/nosql/{projectId}/collections/{name}` | Find documents |
| GET | `/v1/nosql/{projectId}/collections/{name}/{docId}` | Get document |
| POST | `/v1/nosql/{projectId}/collections/{name}` | Insert document(s) |
| PATCH | `/v1/nosql/{projectId}/collections/{name}/{docId}` | Update document |
| DELETE | `/v1/nosql/{projectId}/collections/{name}/{docId}` | Delete document |
| POST | `/v1/nosql/{projectId}/collections/{name}/aggregate` | Aggregation pipeline |

### 7.4 Key-Value Endpoints (`/v1/kv/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/kv/{projectId}/{key}` | Get value |
| PUT | `/v1/kv/{projectId}/{key}` | Set value (upsert) |
| DELETE | `/v1/kv/{projectId}/{key}` | Delete key |
| GET | `/v1/kv/{projectId}` | List keys (`?prefix=`) |
| POST | `/v1/kv/{projectId}/batch` | Batch get/set |

### 7.5 Storage Endpoints (`/v1/storage/`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/storage/{projectId}/{bucket}/upload` | Get presigned PUT URL |
| GET | `/v1/storage/{projectId}/{bucket}/files` | List files |
| DELETE | `/v1/storage/{projectId}/{bucket}/{path}` | Delete file |
| GET | `/v1/storage/{projectId}/{bucket}/{path}/url` | Get presigned GET URL |

Files are **never proxied through FastAPI** — always presigned URLs direct to MinIO.

### 7.6 Superadmin Endpoints (`/superadmin/`)

All routes require both `X-Internal-Secret` and a valid `X-Staff-Token` JWT.
Each route additionally enforces the minimum role required via `require_staff_role(...)`.

| Method | Path | Min Role | Description |
|--------|------|----------|-------------|
| GET | `/superadmin/metrics` | ops | Platform-wide metrics |
| GET | `/superadmin/users` | support | List all developer accounts |
| GET | `/superadmin/users/{id}` | support | Developer detail + projects |
| PATCH | `/superadmin/users/{id}` | support | Update account (ban, verify) |
| DELETE | `/superadmin/users/{id}` | super_admin | Delete account |
| GET | `/superadmin/organizations` | support | List all orgs |
| PATCH | `/superadmin/organizations/{id}/plan` | billing | Override org plan |
| GET | `/superadmin/projects` | support | List all projects |
| PATCH | `/superadmin/projects/{id}/status` | ops | Pause / reactivate project |
| GET | `/superadmin/billing` | billing | Revenue, subscriptions |
| GET | `/superadmin/audit` | ops | Platform-wide audit log |
| GET | `/superadmin/staff` | super_admin | List staff accounts |
| POST | `/superadmin/staff` | super_admin | Invite staff member |
| PATCH | `/superadmin/staff/{id}/role` | super_admin | Change staff role |
| DELETE | `/superadmin/staff/{id}` | super_admin | Deactivate staff account |
| POST | `/superadmin/impersonate/{userId}` | super_admin | Issue impersonation token |

---

## 8. Feature Modules

### 8.1 SQL Database Module

- `backend/app/engines/query_engine.py` — REST params → parameterized SQLAlchemy Core
- `backend/app/api/v1/db/router.py`
- DDL only via dashboard internal API, never `/v1/`
- All queries use bound parameters — zero string interpolation

### 8.2 NoSQL Module (MongoDB)

- `backend/app/engines/nosql_engine.py` — document CRUD + aggregation
- `_kv` is a reserved collection per project — key-value store with unique index on `key`
- Optional TTL via MongoDB TTL index on the `ttl` field
- Collection names beginning with `_` are reserved
- `mongoDatabase` on `projects` table is authoritative — never construct by convention at query time

### 8.3 Storage Module (MinIO)

- `backend/app/storage/minio.py` — boto3 client with `endpoint_url` pointing at MinIO
- Never proxy file content through FastAPI — always presigned URLs
- Bucket naming: `{projectId}-{userBucketName}`, lowercase, hyphens only
- Validate bucket belongs to project before presigning

```python
# backend/app/storage/minio.py
import boto3
from app.config import settings

s3 = boto3.client(
    "s3",
    endpoint_url=f"{'https' if settings.minio_use_ssl else 'http'}://{settings.minio_endpoint}",
    aws_access_key_id=settings.minio_access_key,
    aws_secret_access_key=settings.minio_secret_key,
    region_name="us-east-1",
)
```

### 8.4 Auth Module

Per-project user management — email/password, magic link, OAuth. JWTs issued by
`backend/app/auth/project_auth.py` using `python-jose`. Token audience = `proj_{id}`.

### 8.5 Realtime Module

PostgreSQL LISTEN/NOTIFY for SQL tables. MongoDB Change Streams for collections.
Both fed into Socket.io via Celery bridge.

### 8.6 Permission Engine

Unified JSON rule format evaluated at query time for both SQL and NoSQL:

```json
{
  "resource": "posts",
  "engine": "sql",
  "rules": [
    { "operation": "SELECT", "allow": "authenticated", "condition": "user_id = auth.uid()" },
    { "operation": "INSERT", "allow": "authenticated", "condition": null },
    { "operation": "UPDATE", "allow": "authenticated", "condition": "user_id = auth.uid()" },
    { "operation": "DELETE", "allow": "authenticated", "condition": "user_id = auth.uid()" }
  ]
}
```

For NoSQL, `condition` becomes a MongoDB filter dict with `$auth.uid` as a placeholder.
Rules cached in Redis (TTL: 5 min).

---

## 9. SDK — JavaScript/TypeScript & Python

The SDK is service 3. It is a thin client wrapper around the FastAPI `/v1/` API.
It contains **zero business logic** — it formats requests, handles auth headers, and parses responses.

### 9.1 Design Principles

- Both SDKs (JS and Python) expose an **identical API surface** — same method names, same option shapes.
- Fully typed — TypeScript generics + Python type annotations. No `any` / no untyped dicts.
- Both SDKs are published as separate packages but developed in the same monorepo under `sdk/`.
- The JS SDK ships ESM + CJS (via tsup). Targets Node.js 18+, browsers, and edge runtimes.
- The Python SDK targets Python 3.9+. Uses `httpx` for async HTTP. Ships a sync wrapper too.
- No SDK should ever embed a `service` role API key in client-side code — document this clearly.

### 9.2 JavaScript/TypeScript SDK (`@yourbaas/sdk`)

**Installation:**
```bash
npm install @yourbaas/sdk
```

**Initialization:**
```typescript
import { BaasClient } from '@yourbaas/sdk'

const baas = new BaasClient({
  projectId: 'proj_abc123',
  apiKey: 'sk_anon_...',       // anon key — safe for client-side
  baseUrl: 'https://api.yourbaas.com',  // optional, defaults to production
})
```

**SQL database:**
```typescript
// Query
const { data, meta } = await baas.db('posts')
  .select('id, title, created_at')
  .filter('status', 'eq', 'published')
  .order('created_at', 'desc')
  .limit(20)
  .execute()

// Insert
const { data } = await baas.db('posts').insert({ title: 'Hello', status: 'draft' })

// Update
await baas.db('posts').update('post-id-123', { status: 'published' })

// Delete
await baas.db('posts').delete('post-id-123')
```

**NoSQL document store:**
```typescript
// Find documents
const { data } = await baas.nosql('articles')
  .find({ category: 'tech' })
  .sort({ createdAt: -1 })
  .limit(10)
  .execute()

// Insert
const { data } = await baas.nosql('articles').insertOne({ title: 'Hello', category: 'tech' })

// Update
await baas.nosql('articles').updateOne('doc-id', { $set: { title: 'Updated' } })
```

**Key-value store:**
```typescript
await baas.kv.set('user:prefs:theme', 'dark')
const theme = await baas.kv.get('user:prefs:theme')
await baas.kv.delete('user:prefs:theme')
const keys = await baas.kv.list({ prefix: 'user:prefs:' })
```

**Storage (MinIO):**
```typescript
// Get a presigned upload URL, upload directly — SDK never sends file through server
const { uploadUrl, fileUrl } = await baas.storage('avatars').upload({
  filename: 'profile.jpg',
  contentType: 'image/jpeg',
})
await fetch(uploadUrl, { method: 'PUT', body: fileBlob })
// fileUrl is now the public/presigned download URL
```

**Auth:**
```typescript
await baas.auth.signUp({ email, password })
const session = await baas.auth.signIn({ email, password })
baas.auth.onSessionChange((session) => { /* handle */ })
await baas.auth.signOut()
```

**Realtime:**
```typescript
// Subscribe to SQL table changes
const unsub = baas.realtime.on('posts', (event) => {
  console.log(event.type, event.record) // INSERT | UPDATE | DELETE
})

// Subscribe to NoSQL collection changes
const unsub2 = baas.realtime.onCollection('articles', (event) => { ... })

// Cleanup
unsub()
```

**SDK internal structure rules:**
- `src/utils/fetch.ts` handles all HTTP — injects `Authorization` header, retries on 429.
- `src/modules/*.ts` are pure — they only call `fetch.ts`, never `window` or Node APIs directly.
- Realtime uses a Socket.io client internally — `src/modules/realtime.ts`.
- All errors throw `BaasError` with `code`, `message`, and optional `details`.
- Export everything from `src/index.ts`. No deep imports (`@yourbaas/sdk/modules/auth` is wrong).

### 9.3 Python SDK (`yourbaas`)

**Installation:**
```bash
pip install yourbaas
```

**Initialization:**
```python
from yourbaas import BaasClient

baas = BaasClient(
    project_id="proj_abc123",
    api_key="sk_anon_...",
    base_url="https://api.yourbaas.com",  # optional
)
```

**SQL database:**
```python
# Async (recommended)
result = await baas.db("posts") \
    .select("id, title, created_at") \
    .filter("status", "eq", "published") \
    .order("created_at", "desc") \
    .limit(20) \
    .execute()

# Sync wrapper (for scripts / notebooks)
from yourbaas import BaasClientSync
baas_sync = BaasClientSync(project_id="...", api_key="...")
result = baas_sync.db("posts").select("*").execute()
```

**NoSQL document store:**
```python
result = await baas.nosql("articles").find({"category": "tech"}).limit(10).execute()
doc = await baas.nosql("articles").insert_one({"title": "Hello"})
await baas.nosql("articles").update_one("doc-id", {"$set": {"title": "Updated"}})
```

**Key-value store:**
```python
await baas.kv.set("user:prefs:theme", "dark")
theme = await baas.kv.get("user:prefs:theme")
await baas.kv.delete("user:prefs:theme")
keys = await baas.kv.list(prefix="user:prefs:")
```

**Storage:**
```python
upload_url, file_url = await baas.storage("avatars").upload(
    filename="profile.jpg",
    content_type="image/jpeg",
)
# PUT to upload_url yourself using httpx/requests
```

**Python SDK internal structure rules:**
- `src/yourbaas/utils/http.py` — httpx `AsyncClient` wrapper, injects auth headers.
- All module classes in `src/yourbaas/modules/` are async; `BaasClientSync` wraps them with `asyncio.run`.
- All models typed with dataclasses or Pydantic v2 (not plain dicts).
- Errors raise `BaasError(code, message, details)`.
- Export everything from `src/yourbaas/__init__.py`.

### 9.4 SDK Versioning & Release

- JS SDK and Python SDK are versioned independently using semver.
- SDK versions are coupled to the `/v1/` API version — breaking API changes bump SDK major.
- Changelog maintained at `sdk/js/CHANGELOG.md` and `sdk/python/CHANGELOG.md`.
- CI automatically runs SDK integration tests against the local `backend` service before publish.

---

## 10. Superadmin & RBAC

### 10.1 Staff Roles

There are four staff roles. They are additive — each higher role includes all permissions of roles below it in its category.

| Role | Who | Key capabilities |
|------|-----|-----------------|
| `super_admin` | Platform owner(s) | Everything. Manage staff. Impersonate users. Delete accounts. |
| `ops` | Infrastructure / DevOps | View all projects, pause/resume projects, view audit logs, platform metrics. |
| `billing` | Finance / Revenue | View and override org plans, view invoices and revenue, manage subscriptions. |
| `support` | Customer support | View user accounts, view projects (read-only), verify emails, manage tickets. |

### 10.2 Permission Matrix

Defined in `frontend/config/staff-permissions.ts` and enforced in FastAPI via
`backend/app/middleware/staff_auth.py`. Never hardcode role checks inline — always reference this matrix.

```typescript
// frontend/config/staff-permissions.ts
export const STAFF_PERMISSIONS = {
  // Users
  'users:read':          ['support', 'ops', 'billing', 'super_admin'],
  'users:update':        ['support', 'super_admin'],
  'users:delete':        ['super_admin'],
  'users:impersonate':   ['super_admin'],

  // Organizations
  'orgs:read':           ['support', 'ops', 'billing', 'super_admin'],
  'orgs:update_plan':    ['billing', 'super_admin'],
  'orgs:delete':         ['super_admin'],

  // Projects
  'projects:read':       ['support', 'ops', 'billing', 'super_admin'],
  'projects:pause':      ['ops', 'super_admin'],
  'projects:delete':     ['super_admin'],

  // Billing
  'billing:read':        ['billing', 'super_admin'],
  'billing:update':      ['billing', 'super_admin'],

  // Audit
  'audit:read':          ['ops', 'billing', 'super_admin'],

  // Staff management
  'staff:read':          ['super_admin'],
  'staff:invite':        ['super_admin'],
  'staff:update_role':   ['super_admin'],
  'staff:deactivate':    ['super_admin'],

  // Platform
  'flags:read':          ['ops', 'super_admin'],
  'flags:update':        ['ops', 'super_admin'],
  'metrics:read':        ['ops', 'billing', 'super_admin'],
} as const

export type StaffPermission = keyof typeof STAFF_PERMISSIONS
export type StaffRole = 'super_admin' | 'ops' | 'billing' | 'support'

export function hasPermission(role: StaffRole, permission: StaffPermission): boolean {
  return (STAFF_PERMISSIONS[permission] as readonly string[]).includes(role)
}
```

### 10.3 FastAPI Enforcement

```python
# backend/app/middleware/staff_auth.py
from enum import Enum
from fastapi import Header, HTTPException, Depends
from app.auth.staff_auth import verify_staff_token
from app.models.staff import StaffContext

class StaffRole(str, Enum):
    super_admin = "super_admin"
    ops         = "ops"
    billing     = "billing"
    support     = "support"

ROLE_HIERARCHY = {
    StaffRole.support:     0,
    StaffRole.billing:     1,
    StaffRole.ops:         2,
    StaffRole.super_admin: 3,
}

async def get_staff_context(
    x_staff_token: str = Header(...),
    x_internal_secret: str = Header(...),
) -> StaffContext:
    if x_internal_secret != settings.internal_api_secret:
        raise HTTPException(401, "Invalid internal secret")
    return await verify_staff_token(x_staff_token)

def require_staff_role(minimum_role: StaffRole):
    """FastAPI dependency — use as Depends(require_staff_role('ops'))"""
    async def check(staff: StaffContext = Depends(get_staff_context)) -> StaffContext:
        if ROLE_HIERARCHY[staff.role] < ROLE_HIERARCHY[minimum_role]:
            raise HTTPException(403, f"Requires {minimum_role} role or higher")
        return staff
    return check
```

```python
# Usage in a superadmin router
@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    staff: StaffContext = Depends(require_staff_role(StaffRole.super_admin)),
):
    ...
```

### 10.4 Bootstrap

On first deploy, if no `super_admin` exists in the `staff` table, FastAPI reads
`BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` from environment and creates the
initial account. This only runs once — subsequent deploys skip it if any super_admin exists.

```python
# backend/app/main.py — startup event
@app.on_event("startup")
async def bootstrap_superadmin():
    if not await staff_repo.any_super_admin_exists():
        await staff_repo.create({
            "email": settings.bootstrap_admin_email,
            "hashed_password": bcrypt(settings.bootstrap_admin_password),
            "role": "super_admin",
            "name": "Platform Admin",
        })
```

### 10.5 Next.js Guard

```typescript
// frontend/lib/auth/superadmin-guard.ts
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { hasPermission, type StaffPermission } from '@/config/staff-permissions'

export async function requireStaffPermission(permission: StaffPermission) {
  const session = await getServerSession()
  if (!session?.user?.staffRole) redirect('/login')
  if (!hasPermission(session.user.staffRole, permission)) redirect('/403')
  return session
}
```

```tsx
// frontend/app/(superadmin)/layout.tsx
import { requireStaffPermission } from '@/lib/auth/superadmin-guard'

export default async function SuperadminLayout({ children }) {
  // Any valid staff role can enter the shell; individual pages/routes
  // call requireStaffPermission with the specific permission they need.
  await requireStaffPermission('metrics:read')
  return (
    <div className="flex h-screen">
      <Sidebar variant="superadmin" />
      <main>{children}</main>
    </div>
  )
}
```

### 10.6 Audit Trail

Every superadmin action is written to `audit_logs` with:
- `actor_id` — the staff member's ID
- `actor_role` — their role at time of action
- `action` — e.g. `user.delete`, `org.plan_override`, `staff.invite`
- `resource` — the affected entity ID
- `meta` — before/after snapshot for mutations

Audit logs are append-only. No staff member, including `super_admin`, can delete them via the API.

---

## 11. Pricing Plans

Defined in `frontend/config/plans.ts`. Never hardcode limits anywhere else.

```typescript
export const PLANS = {
  free: {
    name:                'Free',
    price_ngn:           0,
    price_usd:           0,
    sqlRowsPerDb:        50_000,
    nosqlDocumentsPerDb: 50_000,
    kvKeysPerProject:    10_000,
    storageGB:           1,
    bandwidthGB:         5,
    functionsPerMonth:   100_000,
    teamMembers:         1,
    projectsNeverPaused: true,
    support:             'community',
  },
  starter: {
    name:                'Starter',
    price_ngn:           15_000,
    price_usd:           10,
    sqlRowsPerDb:        500_000,
    nosqlDocumentsPerDb: 500_000,
    kvKeysPerProject:    100_000,
    storageGB:           10,
    bandwidthGB:         50,
    functionsPerMonth:   1_000_000,
    teamMembers:         3,
    projectsNeverPaused: true,
    support:             'email',
  },
  pro: {
    name:                'Pro',
    price_ngn:           45_000,
    price_usd:           30,
    sqlRowsPerDb:        null,
    nosqlDocumentsPerDb: null,
    kvKeysPerProject:    null,
    storageGB:           100,
    bandwidthGB:         500,
    functionsPerMonth:   null,
    teamMembers:         10,
    projectsNeverPaused: true,
    support:             'priority',
  },
} as const
```

---

## 12. Middleware & Security

### FastAPI Middleware Stack (`/v1/*`)

1. CORS — `*` for `/v1/*`, same-origin for `/internal/*` and `/superadmin/*`
2. `api_key.py` — SHA-256 → Redis (60s TTL) → PostgreSQL fallback
3. `rate_limit.py` — sliding window per key

### FastAPI Middleware Stack (`/superadmin/*`)

1. `X-Internal-Secret` header validation — confirms caller is Next.js, not public
2. `X-Staff-Token` JWT validation → StaffContext
3. `require_staff_role(minimum)` — per-route role enforcement

### Security rules — mandatory for all agents

- Never log raw API keys — log `keyPrefix` only
- Never store API keys or passwords in plaintext — bcrypt always
- Never expose `service` role keys in logs, errors, or client responses
- Always cross-validate `project_id` in route handlers against `request.state.project_id`
- SQL safety — SQLAlchemy Core with bound params only, zero string interpolation
- NoSQL safety — Pydantic-validate all filter JSON before passing to Motor; never pass raw user input as a MongoDB operator
- MinIO safety — validate bucket belongs to project before presigning
- Superadmin safety — every `/superadmin/*` route must use `require_staff_role(...)` dependency; no exceptions
- STAFF_JWT_SECRET must be different from AUTH_SECRET and JWT_SECRET — never share secrets across contexts
- Audit all superadmin mutations in `audit_logs` — no mutations without a log entry

---

## 13. Development Workflow

### Setup

```bash
# 1. Clone
git clone https://github.com/your-org/baas-platform && cd baas-platform

# 2. Environment
cp .env.example .env   # fill in secrets

# 3. Start all services
docker compose up -d

# 4. Run migrations
docker compose exec backend alembic upgrade head

# 5. Seed dev data (creates 1 org, 2 projects, 1 staff super_admin)
docker compose exec backend python -m app.tasks.seed

# Frontend:       http://localhost:3000
# FastAPI docs:   http://localhost:8000/docs
# MinIO console:  http://localhost:9001  (minioadmin / minioadmin)
# Superadmin:     http://localhost:3000/superadmin
```

### npm scripts (frontend/)

```json
{
  "dev":         "next dev",
  "build":       "next build",
  "db:generate": "drizzle-kit generate",
  "db:migrate":  "drizzle-kit migrate",
  "test":        "vitest",
  "test:e2e":    "playwright test",
  "lint":        "next lint",
  "typecheck":   "tsc --noEmit"
}
```

### Python commands (backend/)

```bash
uv run uvicorn app.main:app --reload
uv run alembic upgrade head
uv run pytest
uv run celery -A app.tasks.celery_app worker
```

### SDK development (sdk/)

```bash
# JS
cd sdk/js && npm install && npm run dev   # watch mode via tsup
npm run test                              # Vitest
npm run build && npm publish              # publish to npm

# Python
cd sdk/python && uv sync && uv run pytest
uv run hatch build && uv run hatch publish
```

### Git conventions

- Branches: `feat/`, `fix/`, `chore/`, `docs/`
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`
- PRs require: CI green, zero TS errors, zero ESLint errors, zero mypy errors

---

## 14. Coding Conventions for Agents

### TypeScript (Next.js + SDK JS)

- Strict mode. `any` is banned. Use `unknown` and narrow.
- `type` over `interface` for object shapes.
- Zod for runtime validation (API input, env vars).
- Server components by default; `'use client'` only when needed.
- CSS variables for every color — never raw Tailwind color classes.
- SDK: no Node.js-only APIs in `src/modules/` — must work in browser and edge runtimes.

### Python (FastAPI + SDK Python)

- Python 3.12+ backend, 3.9+ SDK (to maximise compatibility).
- All functions typed with annotations. `mypy --strict` must pass.
- Pydantic v2 for all request/response models.
- `async def` for all route handlers and engine methods.
- SQLAlchemy 2 async style only. Motor for MongoDB — no pymongo sync.
- `ruff check` must pass. No `print()` — use the `logging` module.

### Business logic placement

- Engines (`backend/app/engines/`) own all BaaS logic. Routers parse, delegate, respond.
- Provisioners (`backend/app/provisioner/`) own all resource create/teardown.
- Superadmin routers (`backend/app/api/superadmin/`) may query the DB directly for simple reads
  but delegate mutations to engine/service layers.
- Next.js route handlers are thin proxies — no business logic.
- SDK modules are HTTP wrappers — no business logic whatsoever.

---

## 15. Testing Strategy

### Python unit tests

```bash
cd backend && uv run pytest tests/unit/
```
Targets: `engines/`, `auth/`, `middleware/staff_auth.py`

### Python integration tests

```bash
uv run pytest tests/integration/
```
Each suite spins up a fresh PostgreSQL schema + MongoDB database, runs operations, tears down.
`test_superadmin_api.py` tests every role-permission boundary (e.g. `support` cannot call `users:delete`).

### TypeScript unit tests (Vitest)

```bash
cd frontend && npm test
cd sdk/js && npm test
```

### SDK integration tests

```bash
# Run against local backend (docker compose up first)
cd sdk/js && npm run test:integration
cd sdk/python && uv run pytest tests/integration/
```

### E2E tests (Playwright)

Covers:
1. Developer flow: signup → create project → SQL table → insert → read via SDK
2. NoSQL flow: create collection → insert document → query → KV set/get
3. Storage flow: create bucket → presigned upload → list files
4. Superadmin flow: staff login → view users → change org plan → check audit log

```bash
cd frontend && npm run test:e2e
```

---

## 16. Deployment

### docker-compose.yml

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    env_file: .env
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: .env
    depends_on: [postgres, mongo, redis, minio]

  celery:
    build: ./backend
    command: celery -A app.tasks.celery_app worker -l info
    env_file: .env
    depends_on: [redis, postgres, mongo]

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB:       baas_platform
      POSTGRES_USER:     postgres
      POSTGRES_PASSWORD: postgres
    volumes: [postgres_data:/var/lib/postgresql/data]
    ports: ["5432:5432"]

  mongo:
    image: mongo:7
    volumes: [mongo_data:/data/db]
    ports: ["27017:27017"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER:     minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes: [minio_data:/data]
    ports:
      - "9000:9000"
      - "9001:9001"

volumes:
  postgres_data:
  mongo_data:
  minio_data:
```

### FastAPI Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install uv && uv sync --no-dev
COPY . .
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Production notes

- MinIO: put behind Caddy/Nginx with TLS. Set `MINIO_PUBLIC_ENDPOINT` to the HTTPS URL.
- FastAPI: not exposed publicly — Caddy routes `/v1/*` and `/superadmin/*` to `backend:8000`.
- Superadmin routes should be IP-allowlisted at the reverse proxy level in production.
- Set `MINIO_USE_SSL=true` with a valid cert in production.
- SDK: publish `@yourbaas/sdk` and `yourbaas` to npm/PyPI from CI on version tags only.

---

## 17. Roadmap & Priorities

**Phase 1 — Foundation**
- [ ] Platform auth (login, signup, OAuth) — Next.js/Auth.js
- [ ] FastAPI service skeleton + internal auth
- [ ] Superadmin bootstrap + staff login + RBAC middleware
- [ ] Superadmin shell UI (layout, sidebar, metrics page)
- [ ] SQL provisioner
- [ ] NoSQL provisioner (MongoDB database + `_kv` setup)
- [ ] MinIO bucket provisioner
- [ ] SQL database REST API
- [ ] NoSQL document + key-value API
- [ ] Dashboard shell (sidebar, project switcher, theme toggle)
- [ ] API key management

**Phase 2 — Core BaaS**
- [ ] Storage module (MinIO + presigned uploads + dashboard UI)
- [ ] Permission engine — SQL + NoSQL unified rules
- [ ] Visual schema builder (SQL)
- [ ] Visual collection builder (NoSQL)
- [ ] Realtime (PostgreSQL NOTIFY + MongoDB Change Streams)
- [ ] Usage tracking + Paystack billing
- [ ] JS/TS SDK (`@yourbaas/sdk`) — core modules (db, nosql, kv, storage, auth)
- [ ] Python SDK (`yourbaas`) — mirrors JS SDK
- [ ] Superadmin: user management, org management, billing override, audit log UI

**Phase 3 — Differentiation**
- [ ] AI/vector module (pgvector)
- [ ] Edge functions
- [ ] Visual permission editor
- [ ] SDK: realtime + functions modules
- [ ] SDK: React hooks package (`@yourbaas/react`)
- [ ] Multi-region support (Lagos, London, Singapore)
- [ ] MCP server endpoint
- [ ] Superadmin: feature flags, impersonation

**Phase 4 — Scale**
- [ ] CLI tool (`npx yourbaas init`)
- [ ] GitHub integration
- [ ] SOC 2 / NDPR / GDPR compliance tooling
- [ ] Enterprise SSO
- [ ] Offline-first mobile SDK (React Native + Flutter)

---

## 18. Do Not Do — Agent Rules

**Stack:**
- ❌ Do not use `prisma` — Next.js uses Drizzle (platform tables only)
- ❌ Do not use the `pages/` directory — App Router only
- ❌ Do not use `getServerSideProps` or `getStaticProps`
- ❌ Do not use `any` in TypeScript — ever
- ❌ Do not use pymongo synchronous client — Motor async only
- ❌ Do not use synchronous SQLAlchemy in FastAPI routes — async sessions only

**Architecture:**
-  Alway put the file path in comment at the top of the file to know where the folder file belongs
-  User Shadcn componen and global css, donn'don not dev
- ❌ Do not put business logic in FastAPI routers — engines only
- ❌ Do not put business logic in Next.js route handlers — thin proxies only
- ❌ Do not put any logic in SDK modules — HTTP wrappers only
- ❌ Do not allow DDL SQL through `/v1/` public routes
- ❌ Do not allow MongoDB `$where` or JavaScript operators from user input
- ❌ Do not connect Next.js directly to PostgreSQL project schemas or MongoDB project databases
- ❌ Do not bypass `validate_api_key` on any public FastAPI route
- ❌ Do not bypass `require_staff_role(...)` on any `/superadmin/*` route — no exceptions

**Security:**
- ❌ Do not store API keys or passwords in plaintext — bcrypt always
- ❌ Do not log raw API keys — log `keyPrefix` only
- ❌ Do not commit `.env` or any secrets
- ❌ Do not construct SQL with string formatting or f-strings — SQLAlchemy bound params only
- ❌ Do not pass raw user filter input to Motor — Pydantic validation first
- ❌ Do not proxy file content through FastAPI — MinIO presigned URLs only
- ❌ Do not expose FastAPI directly to the public internet
- ❌ Do not share STAFF_JWT_SECRET with AUTH_SECRET or JWT_SECRET
- ❌ Do not allow any superadmin action without an audit_log entry
- ❌ Do not allow audit_logs to be deleted via any API — append-only

**Storage:**
- ❌ Do not use AWS S3, GCP, or any external storage provider — MinIO only
- ❌ Do not hardcode MinIO credentials — always from `settings`
- ❌ Do not issue presigned URLs without verifying bucket belongs to requesting project

**SDK:**
- ❌ Do not embed `service` role API keys in SDK examples or documentation
- ❌ Do not import Node.js-only modules in `sdk/js/src/modules/` — must be runtime-agnostic
- ❌ Do not diverge the JS and Python SDK method names — they must be identical

**UI / Theme:**
- ❌ Do not use hardcoded Tailwind color classes in components — CSS variables only
- ❌ Do not create new UI primitives from scratch — check `components/ui/` (shadcn) first
- ❌ Do not mix icon libraries — Lucide React only
- ❌ Do not hardcode pricing or plan limits — `config/plans.ts` only
- ❌ Do not add `'use client'` unless the component genuinely needs browser APIs or React state
- ❌ Do not use `--brand` colors in the superadmin shell — use `--admin-brand` for accent elements

---

*Last updated: June 2026 | Maintained by the core team*