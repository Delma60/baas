// frontend/components/auth/AuthPageClient.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Mail,
  Globe,
  RefreshCw,
  MoreVertical,
  Search,
  Plus,
  Info,
  Phone,
  Shield,
  FileText,
  BarChart3,
  Settings,
  Puzzle,
  Copy,
  Check,
  Trash2,
  KeyRound,
  CheckCircle2,
  Fingerprint,
  Unlock,
  ArrowUpDown,
  Ban,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Loader2,
  AlertCircle,
  //   Commit as Github,
  FileText as Github,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AuthUser, AuthStats } from "@/lib/api/auth-client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  projectId: string;
  dbSchema: string;
  initialTab: string;
  initialSearch: string;
  initialUsers: AuthUser[];
  totalUsers: number;
  stats: AuthStats;
  currentPage: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const TABS = [
  { id: "users", label: "Users" },
  { id: "signin", label: "Sign-in method" },
  { id: "templates", label: "Templates" },
  { id: "usage", label: "Usage" },
  { id: "settings", label: "Settings" },
];

const SIGN_IN_PROVIDERS = [
  {
    id: "email",
    label: "Email/Password",
    icon: Mail,
    description:
      "Allow users to sign up with their email address and password.",
    enabled: true,
    category: "native",
  },
  {
    id: "phone",
    label: "Phone",
    icon: Phone,
    description: "Allow users to sign up with their phone number and OTP.",
    enabled: false,
    category: "native",
    badge: "SOON",
  },
  {
    id: "magic",
    label: "Email Link (passwordless)",
    icon: Fingerprint,
    description: "Send a one-time sign-in link to the user's email.",
    enabled: false,
    category: "native",
    badge: "SOON",
  },
  {
    id: "google",
    label: "Google",
    icon: Globe,
    description: "Allow users to sign in with their Google account.",
    enabled: false,
    category: "oauth",
  },
  {
    id: "github",
    label: "GitHub",
    icon: Github,
    description: "Allow users to sign in with their GitHub account.",
    enabled: false,
    category: "oauth",
  },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-background p-4">
      <p className="text-[11.5px] text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Add User Dialog ──────────────────────────────────────────────────────────

function AddUserDialog({
  open,
  onClose,
  projectId,
  dbSchema,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  dbSchema: string;
  onCreated: (user: AuthUser) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAdd = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/auth/users?db_schema=${encodeURIComponent(dbSchema)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: name || undefined }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data?.detail ?? data?.error ?? "Failed to create user");
        return;
      }
      onCreated(data.data);
      setEmail("");
      setPassword("");
      setName("");
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Manually create a user with email and password.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Full name (optional)</Label>
            <Input
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Email address</Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Password</Label>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!email || !password || loading}
            className="gap-1.5"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Add user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reset Password Dialog ────────────────────────────────────────────────────

function ResetPasswordDialog({
  open,
  onClose,
  userId,
  userEmail,
  projectId,
  dbSchema,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  projectId: string;
  dbSchema: string;
}) {
  const [newPassword, setNewPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 8) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/auth/users/${userId}/reset-password?db_schema=${encodeURIComponent(dbSchema)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_password: newPassword }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.detail ?? "Failed to reset password");
        return;
      }
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setNewPassword("");
        onClose();
      }, 1500);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for <strong>{userEmail}</strong>.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}
        <div className="space-y-1.5 py-1">
          <Label className="text-xs font-medium">New password</Label>
          <Input
            type="password"
            placeholder="Min. 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleReset}
            disabled={newPassword.length < 8 || loading || done}
            className="gap-1.5"
          >
            {done ? (
              <>
                <Check className="h-3.5 w-3.5" /> Done!
              </>
            ) : loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Reset password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AuthPageClient({
  userId,
  projectId,
  dbSchema,
  initialTab,
  initialSearch,
  initialUsers,
  totalUsers,
  stats,
  currentPage,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [users, setUsers] = React.useState<AuthUser[]>(initialUsers);
  const [total, setTotal] = React.useState(totalUsers);
  const [search, setSearch] = React.useState(initialSearch);
  const [searchInput, setSearchInput] = React.useState(initialSearch);
  const [addUserOpen, setAddUserOpen] = React.useState(false);
  const [resetTarget, setResetTarget] = React.useState<AuthUser | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [providers, setProviders] = React.useState<Record<string, boolean>>(
    Object.fromEntries(SIGN_IN_PROVIDERS.map((p) => [p.id, p.enabled])),
  );

  const PAGE_SIZE = 50;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Navigate with search/page params
  const navigate = (opts: { tab?: string; search?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (opts.tab ?? activeTab) params.set("tab", opts.tab ?? activeTab);
    if (opts.search !== undefined ? opts.search : search)
      params.set("search", opts.search !== undefined ? opts.search : search);
    if ((opts.page ?? currentPage) > 1)
      params.set("page", String(opts.page ?? currentPage));
    router.push(`?${params.toString()}`);
  };

  const handleSearch = () => {
    navigate({ search: searchInput, page: 1 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDelete = async (user: AuthUser) => {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/auth/users/${user.id}?db_schema=${encodeURIComponent(dbSchema)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setTotal((prev) => prev - 1);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleVerify = async (user: AuthUser) => {
    setVerifyingId(user.id);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/auth/users/${user.id}?db_schema=${encodeURIComponent(dbSchema)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_email_verified: true }),
        },
      );
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, is_email_verified: true } : u,
          ),
        );
      }
    } finally {
      setVerifyingId(null);
    }
  };

  const handleUserCreated = (user: AuthUser) => {
    setUsers((prev) => [user as AuthUser & { created_at: string }, ...prev]);
    setTotal((prev) => prev + 1);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-full bg-background">
        {/* ── Page title ── */}
        <div className="px-8 pt-8 pb-0">
          <h1 className="text-[28px] font-normal text-foreground tracking-tight mb-5">
            Authentication
          </h1>

          {/* ── Tab bar ── */}
          <div className="flex items-end gap-0 border-b border-border -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate({ tab: tab.id });
                }}
                className={cn(
                  "flex items-center gap-2 px-4 pb-3 pt-1 text-[13.5px] font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-[--brand] text-[--brand]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => setActiveTab("extensions")}
              className={cn(
                "flex items-center gap-1.5 px-4 pb-3 pt-1 text-[13.5px] font-medium whitespace-nowrap border-b-2 transition-colors ml-2",
                activeTab === "extensions"
                  ? "border-[--brand] text-[--brand]"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Puzzle className="h-3.5 w-3.5" />
              Extensions
            </button>
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 px-8 py-6">
          {/* ── USERS TAB ── */}
          {activeTab === "users" && (
            <div className="space-y-4 max-w-5xl">
              {/* Search + actions */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by email address or name"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-9 h-9 text-sm bg-muted/30 border-border"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                  onClick={handleSearch}
                >
                  Search
                </Button>
                <Button
                  onClick={() => setAddUserOpen(true)}
                  size="sm"
                  className="h-9 px-5 gap-1.5 bg-[--brand] text-white hover:bg-[--brand-hover] rounded-md text-[13px] font-medium"
                >
                  Add user
                </Button>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4 text-muted-foreground",
                          refreshing && "animate-spin",
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
              </div>

              {/* Table */}
              <div className="border border-border rounded-sm overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[2.5fr_1.5fr_1.5fr_2fr_auto] gap-0 bg-background border-b border-border">
                  {["Identifier", "Status", "Created", "User UID", ""].map(
                    (col, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 text-[12.5px] font-semibold text-foreground"
                      >
                        {col}
                      </div>
                    ),
                  )}
                </div>

                {users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-2">
                    <Users className="h-8 w-8 opacity-30" />
                    {search
                      ? "No users match your search."
                      : "No users yet. Add the first one."}
                  </div>
                ) : (
                  users.map((user, i) => (
                    <div
                      key={user.id}
                      className={cn(
                        "group grid grid-cols-[2.5fr_1.5fr_1.5fr_2fr_auto] gap-0 items-center hover:bg-muted/30 transition-colors",
                        i < users.length - 1 && "border-b border-border/60",
                      )}
                    >
                      {/* Email */}
                      <div className="px-4 py-3 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground uppercase">
                            {user.email[0]}
                          </div>
                          <div className="min-w-0">
                            <span
                              className="text-[13px] text-foreground truncate block max-w-[200px]"
                              title={user.email}
                            >
                              {user.email.length > 30
                                ? user.email.slice(0, 28) + "…"
                                : user.email}
                            </span>
                            {user.name && (
                              <span className="text-[11px] text-muted-foreground">
                                {user.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="px-4 py-3">
                        {user.is_email_verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-[--success-bg] text-[--success-text]">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                            <AlertCircle className="h-3 w-3" />
                            Unverified
                          </span>
                        )}
                      </div>

                      {/* Created */}
                      <div className="px-4 py-3">
                        <span className="text-[13px] text-foreground">
                          {user.created_at ? formatDate(user.created_at) : "—"}
                        </span>
                      </div>

                      {/* UID */}
                      <div className="px-4 py-3 flex items-center gap-2 min-w-0">
                        <span className="text-[12px] text-muted-foreground font-mono truncate">
                          {user.id.length > 20
                            ? user.id.slice(0, 18) + "…"
                            : user.id}
                        </span>
                        <button
                          onClick={() => handleCopy(user.id, user.id)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                        >
                          {copiedId === user.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="px-3 py-3 flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={
                                deletingId === user.id ||
                                verifyingId === user.id
                              }
                            >
                              {deletingId === user.id ||
                              verifyingId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              className="text-xs gap-2"
                              onClick={() => setResetTarget(user)}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              Reset password
                            </DropdownMenuItem>
                            {!user.is_email_verified && (
                              <DropdownMenuItem
                                className="text-xs gap-2"
                                onClick={() => handleVerify(user)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark as verified
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs gap-2 text-destructive focus:text-destructive"
                              onClick={() => handleDelete(user)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground">
                  {total === 0
                    ? "No users"
                    : `${Math.min((currentPage - 1) * PAGE_SIZE + 1, total)}–${Math.min(currentPage * PAGE_SIZE, total)} of ${total} users`}
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={currentPage <= 1}
                      onClick={() => navigate({ page: currentPage - 1 })}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-xs text-muted-foreground px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={currentPage >= totalPages}
                      onClick={() => navigate({ page: currentPage + 1 })}
                    >
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SIGN-IN METHOD TAB ── */}
          {activeTab === "signin" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-[15px] font-medium text-foreground mb-1">
                  Sign-in providers
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Choose the sign-in methods you want to enable for your
                  project.
                </p>
              </div>

              <Alert className="border-sky-200 bg-sky-50 dark:border-sky-800/50 dark:bg-sky-950/20">
                <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <AlertDescription className="text-[12.5px] text-sky-800 dark:text-sky-300">
                  Email/password auth is active. OAuth providers require
                  credentials to be configured.
                </AlertDescription>
              </Alert>

              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Native providers
                </p>
                <div className="border border-border rounded-sm overflow-hidden divide-y divide-border/60">
                  {SIGN_IN_PROVIDERS.filter((p) => p.category === "native").map(
                    (provider) => {
                      const Icon = provider.icon;
                      return (
                        <div
                          key={provider.id}
                          className="flex items-center gap-4 px-4 py-3.5 bg-background hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13.5px] font-medium text-foreground">
                                {provider.label}
                              </span>
                              {provider.badge && (
                                <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                                  {provider.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                              {provider.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "text-[11.5px] font-medium",
                                providers[provider.id]
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground",
                              )}
                            >
                              {providers[provider.id] ? "Enabled" : "Disabled"}
                            </span>
                            <Switch
                              checked={providers[provider.id] ?? false}
                              onCheckedChange={() =>
                                setProviders((prev) => ({
                                  ...prev,
                                  [provider.id]: !prev[provider.id],
                                }))
                              }
                              size="sm"
                              disabled={!!provider.badge}
                            />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  OAuth providers
                </p>
                <div className="border border-border rounded-sm overflow-hidden divide-y divide-border/60">
                  {SIGN_IN_PROVIDERS.filter((p) => p.category === "oauth").map(
                    (provider) => {
                      const Icon = provider.icon;
                      return (
                        <div
                          key={provider.id}
                          className="flex items-center gap-4 px-4 py-3.5 bg-background hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13.5px] font-medium text-foreground">
                              {provider.label}
                            </span>
                            <p className="text-[12px] text-muted-foreground mt-0.5">
                              {provider.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11.5px] text-muted-foreground">
                              Disabled
                            </span>
                            <Switch checked={false} disabled size="sm" />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TEMPLATES TAB ── */}
          {activeTab === "templates" && (
            <div className="max-w-2xl space-y-4">
              <div>
                <h2 className="text-[15px] font-medium text-foreground mb-1">
                  Email templates
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Customize the emails sent to users during authentication
                  flows.
                </p>
              </div>
              <div className="border border-border rounded-sm overflow-hidden divide-y divide-border/60">
                {[
                  {
                    label: "Email address verification",
                    desc: "Sent when a user signs up with email/password.",
                  },
                  {
                    label: "Password reset",
                    desc: "Sent when a user requests a password reset.",
                  },
                  {
                    label: "Email address change",
                    desc: "Sent to the old address when a user changes their email.",
                  },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="flex items-center justify-between px-4 py-3.5 bg-background hover:bg-muted/20 transition-colors group"
                  >
                    <div>
                      <p className="text-[13.5px] font-medium text-foreground">
                        {t.label}
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        {t.desc}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USAGE TAB ── */}
          {activeTab === "usage" && (
            <div className="max-w-2xl space-y-4">
              <div>
                <h2 className="text-[15px] font-medium text-foreground mb-1">
                  Authentication usage
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Real-time stats from your project database.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Total users" value={stats.total_users} />
                <StatCard
                  label="Verified"
                  value={stats.verified_users}
                  sub={`${stats.total_users > 0 ? Math.round((stats.verified_users / stats.total_users) * 100) : 0}% of total`}
                />
                <StatCard label="Unverified" value={stats.unverified_users} />
                <StatCard label="Sign-ups (30d)" value={stats.new_last_30d} />
                <StatCard label="Sign-ups (7d)" value={stats.new_last_7d} />
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-[15px] font-medium text-foreground mb-1">
                  Auth settings
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Configure authentication behaviour for your project.
                </p>
              </div>
              <div className="border border-border rounded-sm overflow-hidden divide-y divide-border/60">
                {[
                  {
                    label: "Allow new sign-ups",
                    desc: "When disabled, only existing users can sign in.",
                    defaultChecked: true,
                  },
                  {
                    label: "Require email verification",
                    desc: "Send a confirmation email before granting access.",
                    defaultChecked: true,
                  },
                  {
                    label: "Allow multiple sessions",
                    desc: "Users can be signed in on multiple devices simultaneously.",
                    defaultChecked: true,
                  },
                ].map((s) => {
                  const [checked, setChecked] = React.useState(
                    s.defaultChecked,
                  );
                  return (
                    <div
                      key={s.label}
                      className="flex items-center justify-between px-4 py-4 bg-background"
                    >
                      <div className="pr-6">
                        <p className="text-[13.5px] font-medium text-foreground">
                          {s.label}
                        </p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          {s.desc}
                        </p>
                      </div>
                      <Switch
                        checked={checked}
                        onCheckedChange={setChecked}
                        size="sm"
                      />
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-[14px] font-medium text-destructive">
                  Danger zone
                </h3>
                <div className="border border-destructive/30 rounded-sm divide-y divide-destructive/20">
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="pr-4">
                      <p className="text-[13.5px] font-medium">
                        Rotate JWT secret
                      </p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        All existing tokens become invalid immediately.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs shrink-0 gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Rotate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── EXTENSIONS TAB ── */}
          {activeTab === "extensions" && (
            <div className="max-w-2xl py-8 text-center text-muted-foreground space-y-2">
              <Puzzle className="h-10 w-10 mx-auto opacity-20" />
              <p className="text-[13px]">Extensions coming soon.</p>
            </div>
          )}
        </div>

        {/* Dialogs */}
        <AddUserDialog
          open={addUserOpen}
          onClose={() => setAddUserOpen(false)}
          projectId={projectId}
          dbSchema={dbSchema}
          onCreated={handleUserCreated}
        />
        {resetTarget && (
          <ResetPasswordDialog
            open={!!resetTarget}
            onClose={() => setResetTarget(null)}
            userId={resetTarget.id}
            userEmail={resetTarget.email}
            projectId={projectId}
            dbSchema={dbSchema}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
