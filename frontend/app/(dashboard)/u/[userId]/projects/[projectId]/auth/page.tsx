// frontend/app/(dashboard)/u/[userId]/projects/[projectId]/auth/page.tsx
"use client";

import * as React from "react";
import {
  Users,
  Mail,
  Clock as Chrome,
  X as Github,
  RefreshCw,
  MoreVertical,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
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
  Ban,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Smartphone,
  Globe,
  Unlock,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_USERS = [
  {
    id: "WKi1SD7CGqdx1SE8mpyPf1T...",
    email: "oladeleofficial+user1@gmail.com",
    providers: ["email"],
    created: "Jun 4, 2026",
    signedIn: "Jun 4, 2026",
    verified: true,
    banned: false,
  },
  {
    id: "afubuoP3m8OP7Hfm38PG9i2j...",
    email: "savagehighb@gmail.com",
    providers: ["email"],
    created: "Jun 4, 2026",
    signedIn: "Jun 4, 2026",
    verified: true,
    banned: false,
  },
  {
    id: "EeJdNUPlPeTlePXobf67NAlt2...",
    email: "oladeleofficial@gmail.com",
    providers: ["email", "google"],
    created: "Jun 3, 2026",
    signedIn: "Jun 5, 2026",
    verified: true,
    banned: false,
  },
  {
    id: "42mnSzffGcTNoRKYlAVsShCR...",
    email: "olaniyiolajumoke41@gmail.com",
    providers: ["email"],
    created: "Jun 3, 2026",
    signedIn: "Jun 6, 2026",
    verified: false,
    banned: false,
  },
  {
    id: "3Tai2lbqXadPnGfV4LWdjPtYv...",
    email: "okaforlucky2000@gmail.com",
    providers: ["email"],
    created: "Jun 2, 2026",
    signedIn: "Jun 2, 2026",
    verified: true,
    banned: false,
  },
  {
    id: "H4xTVwRA1welkrPKQgK6Q9B...",
    email: "harrisonmercywilliams@gmail.com",
    providers: ["email"],
    created: "Jun 2, 2026",
    signedIn: "Jun 2, 2026",
    verified: true,
    banned: true,
  },
  {
    id: "mN8xQpR2wLkJcTvZoUy5hEa...",
    email: "adaeze.okafor@example.com",
    providers: ["google"],
    created: "Jun 1, 2026",
    signedIn: "Jun 6, 2026",
    verified: true,
    banned: false,
  },
  {
    id: "Kp3dFgH7nWqZxRsVmYtL9oC...",
    email: "emeka.nwosu@example.com",
    providers: ["github"],
    created: "May 30, 2026",
    signedIn: "Jun 3, 2026",
    verified: true,
    banned: false,
  },
];

const SIGN_IN_PROVIDERS = [
  {
    id: "email",
    label: "Email/Password",
    icon: Mail,
    description: "Allow users to sign up with their email address and password.",
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
    badge: "NEW",
  },
  {
    id: "google",
    label: "Google",
    icon: Chrome,
    description: "Allow users to sign in with their Google account.",
    enabled: true,
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
  {
    id: "magic",
    label: "Email Link (passwordless)",
    icon: Fingerprint,
    description: "Send a one-time sign-in link to the user's email.",
    enabled: false,
    category: "native",
    badge: "NEW",
  },
];

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  email: Mail,
  google: Chrome,
  github: Github,
  phone: Phone,
};

// ─── Tab navigation ───────────────────────────────────────────────────────────

const TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "signin", label: "Sign-in method", icon: Shield },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "usage", label: "Usage", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

// ─── Provider icon pill ───────────────────────────────────────────────────────

function ProviderIcon({ provider }: { provider: string }) {
  const Icon = PROVIDER_ICONS[provider] ?? Globe;
  return (
    <Tooltip>
      <TooltipTrigger >
        <div className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="capitalize">
        {provider}
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Add user dialog ──────────────────────────────────────────────────────────

function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [done, setDone] = React.useState(false);

  const handleAdd = () => {
    if (!email || !password) return;
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setEmail("");
      setPassword("");
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
          <DialogDescription>
            Manually create a user with email and password. They can sign in immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
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
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!email || !password || done}
            className="gap-1.5"
          >
            {done ? <><Check className="h-3.5 w-3.5" /> Added!</> : "Add user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [activeTab, setActiveTab] = React.useState("users");
  const [search, setSearch] = React.useState("");
  const [addUserOpen, setAddUserOpen] = React.useState(false);
  const [sortField, setSortField] = React.useState<"created" | "signedIn">("created");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [showBanner, setShowBanner] = React.useState(true);
  const [providers, setProviders] = React.useState<Record<string, boolean>>(
    Object.fromEntries(SIGN_IN_PROVIDERS.map((p) => [p.id, p.enabled]))
  );
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const toggleProvider = (id: string) =>
    setProviders((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSort = (field: "created" | "signedIn") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filteredUsers = MOCK_USERS.filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase())
  );

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
                onClick={() => setActiveTab(tab.id)}
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
            {/* Extensions with icon */}
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
              {/* Info banner */}
              {showBanner && (
                <Alert className="border-sky-200 bg-sky-50 dark:border-sky-800/50 dark:bg-sky-950/20 pr-3">
                  <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <AlertDescription className="text-[13px] text-sky-800 dark:text-sky-300 flex-1">
                    The following Authentication features will stop working when Firebase Dynamic Links shuts down soon: email link authentication for mobile apps, as well as Cordova OAuth support for web apps.
                  </AlertDescription>
                  <button
                    onClick={() => setShowBanner(false)}
                    className="ml-2 text-sky-600 hover:text-sky-800 dark:text-sky-400 shrink-0"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </Alert>
              )}

              {/* Search + actions row */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by email address, phone number, or user UID"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-sm bg-muted/30 border-border"
                  />
                </div>

                <Button
                  onClick={() => setAddUserOpen(true)}
                  size="sm"
                  className="h-9 px-5 gap-1.5 bg-[--brand] text-white hover:bg-[--brand-hover] rounded-md text-[13px] font-medium"
                >
                  Add user
                </Button>

                <Tooltip>
                  <TooltipTrigger >
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger >
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>More options</TooltipContent>
                </Tooltip>
              </div>

              {/* Table */}
              <div className="border border-border rounded-sm overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[2fr_1fr_1.2fr_1.2fr_2fr_auto] gap-0 bg-background border-b border-border">
                  {[
                    { key: null, label: "Identifier", className: "px-4 py-3" },
                    { key: null, label: "Providers", className: "px-4 py-3" },
                    { key: "created", label: "Created", className: "px-4 py-3 cursor-pointer select-none" },
                    { key: "signedIn", label: "Signed In", className: "px-4 py-3 cursor-pointer select-none" },
                    { key: null, label: "User UID", className: "px-4 py-3" },
                    { key: null, label: "", className: "px-4 py-3 w-10" },
                  ].map((col, i) => (
                    <div
                      key={i}
                      className={cn("flex items-center gap-1 text-[12.5px] font-semibold text-foreground", col.className)}
                      onClick={() => col.key && handleSort(col.key as "created" | "signedIn")}
                    >
                      {col.label}
                      {col.key && (
                        <ArrowUpDown
                          className={cn(
                            "h-3 w-3",
                            sortField === col.key ? "text-foreground" : "text-muted-foreground",
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-2">
                    <Users className="h-8 w-8 opacity-30" />
                    No users match your search.
                  </div>
                ) : (
                  filteredUsers.map((user, i) => (
                    <div
                      key={user.id}
                      className={cn(
                        "group grid grid-cols-[2fr_1fr_1.2fr_1.2fr_2fr_auto] gap-0 items-center hover:bg-muted/30 transition-colors",
                        i < filteredUsers.length - 1 && "border-b border-border/60",
                        user.banned && "opacity-60",
                      )}
                    >
                      {/* Identifier */}
                      <div className="px-4 py-3 min-w-0">
                        <span
                          className="text-[13px] text-foreground truncate block max-w-[220px]"
                          title={user.email}
                        >
                          {user.email.length > 32
                            ? user.email.slice(0, 30) + "…"
                            : user.email}
                        </span>
                        {user.banned && (
                          <span className="text-[10px] font-semibold text-rose-500 mt-0.5 block">
                            Banned
                          </span>
                        )}
                        {!user.verified && !user.banned && (
                          <span className="text-[10px] font-semibold text-amber-500 mt-0.5 block">
                            Unverified
                          </span>
                        )}
                      </div>

                      {/* Providers */}
                      <div className="px-4 py-3 flex items-center gap-1">
                        {user.providers.map((p) => (
                          <ProviderIcon key={p} provider={p} />
                        ))}
                      </div>

                      {/* Created */}
                      <div className="px-4 py-3">
                        <span className="text-[13px] text-foreground">{user.created}</span>
                      </div>

                      {/* Signed In */}
                      <div className="px-4 py-3">
                        <span className="text-[13px] text-foreground">{user.signedIn}</span>
                      </div>

                      {/* UID */}
                      <div className="px-4 py-3 flex items-center gap-2 min-w-0">
                        <span className="text-[13px] text-muted-foreground font-mono truncate">
                          {user.id}
                        </span>
                        <button
                          onClick={() => handleCopy(user.id, user.id.replace("...", "xxxxx"))}
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
                          <DropdownMenuTrigger >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem className="text-xs gap-2">
                              <KeyRound className="h-3.5 w-3.5" />
                              Reset password
                            </DropdownMenuItem>
                            {!user.verified && (
                              <DropdownMenuItem className="text-xs gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Verify email
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs gap-2">
                              {user.banned ? (
                                <><Unlock className="h-3.5 w-3.5" /> Unban user</>
                              ) : (
                                <><Ban className="h-3.5 w-3.5" /> Disable account</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive">
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

              {/* Footer count */}
              <p className="text-[12px] text-muted-foreground">
                {filteredUsers.length} of {MOCK_USERS.length} users
              </p>
            </div>
          )}

          {/* ── SIGN-IN METHOD TAB ── */}
          {activeTab === "signin" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-[15px] font-medium text-foreground mb-1">Sign-in providers</h2>
                <p className="text-[13px] text-muted-foreground">
                  Choose the sign-in methods you want to enable for your project.
                </p>
              </div>

              {/* Native providers */}
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Native providers
                </p>
                <div className="border border-border rounded-sm overflow-hidden divide-y divide-border/60">
                  {SIGN_IN_PROVIDERS.filter((p) => p.category === "native").map((provider) => {
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
                            <span className="text-[13.5px] font-medium text-foreground">{provider.label}</span>
                            {provider.badge && (
                              <span className="rounded-sm bg-sky-100 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                                {provider.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{provider.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {providers[provider.id] ? (
                            <span className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
                              Enabled
                            </span>
                          ) : (
                            <span className="text-[11.5px] text-muted-foreground">Disabled</span>
                          )}
                          <Switch
                            checked={providers[provider.id]}
                            onCheckedChange={() => toggleProvider(provider.id)}
                            size="sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* OAuth providers */}
              <div>
                <p className="text-[11.5px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Additional providers
                </p>
                <div className="border border-border rounded-sm overflow-hidden divide-y divide-border/60">
                  {SIGN_IN_PROVIDERS.filter((p) => p.category === "oauth").map((provider) => {
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
                          <span className="text-[13.5px] font-medium text-foreground">{provider.label}</span>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{provider.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {providers[provider.id] ? (
                            <span className="text-[11.5px] font-medium text-emerald-600 dark:text-emerald-400">
                              Enabled
                            </span>
                          ) : (
                            <span className="text-[11.5px] text-muted-foreground">Disabled</span>
                          )}
                          <Switch
                            checked={providers[provider.id]}
                            onCheckedChange={() => toggleProvider(provider.id)}
                            size="sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(providers.google || providers.github) && (
                  <Alert className="mt-3 border-sky-200 bg-sky-50 dark:border-sky-800/50 dark:bg-sky-950/20">
                    <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <AlertDescription className="text-[12.5px] text-sky-800 dark:text-sky-300">
                      OAuth providers require a client ID and secret. Add them in{" "}
                      <button className="font-semibold underline underline-offset-2">
                        Settings → OAuth credentials
                      </button>
                      .
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          {/* ── TEMPLATES TAB ── */}
          {activeTab === "templates" && (
            <div className="max-w-2xl space-y-4">
              <div>
                <h2 className="text-[15px] font-medium text-foreground mb-1">Email templates</h2>
                <p className="text-[13px] text-muted-foreground">
                  Customize the emails sent to users during authentication flows.
                </p>
              </div>
              <div className="border border-border rounded-sm overflow-hidden divide-y divide-border/60">
                {[
                  { label: "Email address verification", desc: "Sent when a user signs up with email/password." },
                  { label: "Password reset", desc: "Sent when a user requests a password reset." },
                  { label: "Email address change", desc: "Sent to the old address when a user changes their email." },
                  { label: "SMS verification", desc: "Sent when a user adds or verifies a phone number." },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="flex items-center justify-between px-4 py-3.5 bg-background hover:bg-muted/20 transition-colors group"
                  >
                    <div>
                      <p className="text-[13.5px] font-medium text-foreground">{t.label}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{t.desc}</p>
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
                <h2 className="text-[15px] font-medium text-foreground mb-1">Authentication usage</h2>
                <p className="text-[13px] text-muted-foreground">Last 30 days</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total users", value: MOCK_USERS.length.toString() },
                  { label: "Active (30d)", value: "6" },
                  { label: "Sign-ups (30d)", value: "8" },
                  { label: "Unverified", value: MOCK_USERS.filter((u) => !u.verified).length.toString() },
                ].map((s) => (
                  <div key={s.label} className="rounded-sm border border-border bg-background p-4">
                    <p className="text-[11.5px] text-muted-foreground font-medium">{s.label}</p>
                    <p className="text-2xl font-semibold tracking-tight mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h2 className="text-[15px] font-medium text-foreground mb-1">Auth settings</h2>
                <p className="text-[13px] text-muted-foreground">
                  Configure authentication behaviour for your project.
                </p>
              </div>
              <div className="border border-border rounded-sm overflow-hidden divide-y divide-border/60">
                {[
                  {
                    label: "Allow new sign-ups",
                    desc: "When disabled, only existing users can sign in.",
                    key: "signup",
                    default: true,
                  },
                  {
                    label: "Require email verification",
                    desc: "Send a confirmation email before granting access.",
                    key: "emailVerif",
                    default: true,
                  },
                  {
                    label: "Allow multiple sessions",
                    desc: "Users can be signed in on multiple devices simultaneously.",
                    key: "multiSession",
                    default: true,
                  },
                ].map((setting) => {
                  const [checked, setChecked] = React.useState(setting.default);
                  return (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between px-4 py-4 bg-background"
                    >
                      <div className="pr-6">
                        <p className="text-[13.5px] font-medium text-foreground">{setting.label}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{setting.desc}</p>
                      </div>
                      <Switch checked={checked} onCheckedChange={setChecked} size="sm" />
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-[14px] font-medium text-destructive">Danger zone</h3>
                <div className="border border-destructive/30 rounded-sm divide-y divide-destructive/20">
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="pr-4">
                      <p className="text-[13.5px] font-medium">Revoke all sessions</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        Force sign-out every user immediately.
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" className="h-8 text-xs shrink-0">
                      Revoke all
                    </Button>
                  </div>
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="pr-4">
                      <p className="text-[13.5px] font-medium">Rotate JWT secret</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">
                        All existing tokens become invalid immediately.
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" className="h-8 text-xs shrink-0 gap-1.5">
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

        <AddUserDialog open={addUserOpen} onClose={() => setAddUserOpen(false)} />
      </div>
    </TooltipProvider>
  );
}