"use client";
// frontend/components/auth/AuthPageClient.tsx

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Mail,
  Globe,
  RefreshCw,
  MoreVertical,
  Search,
  Plus,
  Phone,
  Fingerprint,
  Copy,
  Check,
  Trash2,
  KeyRound,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Save,
  Send,
  Settings,
  Eye,
  EyeOff,
  RotateCcw,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  BarChart3,
  Shield,
  ServerCrash,
  Pencil,
  Mail as MailIcon,
  MessageSquare,
  ArrowLeft,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
import type {
  AuthSettings,
  EmailTemplates,
  SmtpConfig,
} from "@/lib/api/auth-settings-client";

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
  initialAuthSettings: AuthSettings | null;
  initialEmailTemplates: EmailTemplates | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "signin", label: "Sign-in", icon: Shield },
  { id: "templates", label: "Templates", icon: Mail },
  { id: "usage", label: "Usage", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const SIGN_IN_PROVIDERS = [
  {
    id: "email",
    label: "Email/Password",
    icon: Mail,
    description: "Allow users to sign up with email and password.",
    category: "native",
  },
  {
    id: "phone",
    label: "Phone (OTP)",
    icon: Phone,
    description: "Allow users to sign up with their phone number and OTP.",
    category: "native",
    badge: "SOON",
  },
  {
    id: "magic_link",
    label: "Email link (passwordless)",
    icon: Fingerprint,
    description: "Send a one-time sign-in link to the user's email.",
    category: "native",
    badge: "SOON",
  },
  {
    id: "google",
    label: "Google",
    icon: Globe,
    description: "Allow users to sign in with their Google account.",
    category: "oauth",
    badge: "SOON",
  },
];

interface TemplateMeta {
  key: string;
  label: string;
  desc: string;
  variables: string[];
}

const EMAIL_TEMPLATES: TemplateMeta[] = [
  {
    key: "verification",
    label: "Email address verification",
    desc: "Sent when a user signs up with email/password.",
    variables: ["{{name}}", "{{verification_url}}", "{{app_name}}"],
  },
  {
    key: "password_reset",
    label: "Password reset",
    desc: "Sent when a user requests a password reset.",
    variables: ["{{name}}", "{{reset_url}}", "{{app_name}}"],
  },
  {
    key: "email_change",
    label: "Email address change",
    desc: "Sent to the old address when a user changes their email.",
    variables: [
      "{{name}}",
      "{{new_email}}",
      "{{confirmation_url}}",
      "{{app_name}}",
    ],
  },
  {
    key: "magic_link",
    label: "Magic link (sign-in)",
    desc: "Sent when a user requests a passwordless login link.",
    variables: ["{{magic_url}}", "{{app_name}}"],
  },
];

const DEFAULT_SETTINGS: AuthSettings = {
  allow_signups: true,
  require_email_verification: true,
  allow_multiple_sessions: true,
  min_password_length: 8,
  session_duration_hours: 168,
  providers: {
    email: true,
    phone: false,
    magic_link: false,
    google: false,
    github: false,
  },
  smtp: {
    host: "",
    port: 587,
    user: "",
    password: "",
    from_name: "",
    from_email: "",
    secure: false,
  },
};

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

function fillTemplateBody(body: string): string {
  return (body || "")
    .replace(/\{\{name\}\}/g, "Jane Doe")
    .replace(
      /\{\{verification_url\}\}/g,
      "https://yourapp.com/verify?token=abc123",
    )
    .replace(/\{\{reset_url\}\}/g, "https://yourapp.com/reset?token=abc123")
    .replace(
      /\{\{confirmation_url\}\}/g,
      "https://yourapp.com/confirm?token=abc123",
    )
    .replace(/\{\{magic_url\}\}/g, "https://yourapp.com/magic?token=abc123")
    .replace(/\{\{new_email\}\}/g, "jane@new.com")
    .replace(/\{\{app_name\}\}/g, "YourBaaS");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-[11.5px] text-muted-foreground font-medium">{label}</p>
      <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function SaveBanner({
  dirty,
  saving,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  if (!dirty) return null;
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20 px-4 py-2.5 mb-4">
      <p className="text-[12.5px] text-amber-800 dark:text-amber-300 font-medium">
        You have unsaved changes.
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onDiscard}
          disabled={saving}
        >
          Discard
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save changes
        </Button>
      </div>
    </div>
  );
}

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
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Add
            user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  open,
  onClose,
  userId: uid,
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
        `/api/nosql-proxy/projects/${projectId}/auth/users/${uid}/reset-password?db_schema=${encodeURIComponent(dbSchema)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_password: newPassword }),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d?.detail ?? "Failed");
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

// ─── Inline SMTP Panel ────────────────────────────────────────────────────────

function SmtpPanel({
  projectId,
  initialSmtp,
}: {
  projectId: string;
  initialSmtp: SmtpConfig;
}) {
  const [smtp, setSmtp] = React.useState<SmtpConfig>(initialSmtp);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);

  const update = (key: keyof SmtpConfig, value: string | number | boolean) => {
    setSmtp((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/auth/settings`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: { smtp } }),
        },
      );
      if (res.ok) {
        setSaved(true);
        setDirty(false);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Alert className="border-sky-200 bg-sky-50 dark:border-sky-800/40 dark:bg-sky-950/20 py-3">
        <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        <AlertDescription className="text-[12px] text-sky-800 dark:text-sky-300">
          Credentials are stored encrypted and never returned in API responses.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">SMTP host</Label>
          <Input
            value={smtp.host}
            onChange={(e) => update("host", e.target.value)}
            placeholder="smtp.gmail.com"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Port</Label>
          <Input
            type="number"
            value={smtp.port}
            onChange={(e) => update("port", parseInt(e.target.value) || 587)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Username</Label>
          <Input
            value={smtp.user}
            onChange={(e) => update("user", e.target.value)}
            placeholder="user@gmail.com"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Password</Label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              value={smtp.password}
              onChange={(e) => update("password", e.target.value)}
              className="h-9 text-sm pr-9"
            />
            <button
              onClick={() => setShowPass(!showPass)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">From name</Label>
          <Input
            value={smtp.from_name}
            onChange={(e) => update("from_name", e.target.value)}
            placeholder="YourApp"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">From email</Label>
          <Input
            type="email"
            value={smtp.from_email}
            onChange={(e) => update("from_email", e.target.value)}
            placeholder="noreply@yourapp.com"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <div>
          <p className="text-[13px] font-medium">TLS / STARTTLS</p>
          <p className="text-[11.5px] text-muted-foreground">
            Enable encrypted connection
          </p>
        </div>
        <Switch
          checked={smtp.secure}
          onCheckedChange={(v) => update("secure", v)}
        />
      </div>

      {dirty && (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 bg-brand text-white hover:bg-brand-hover"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saved ? "Saved!" : "Save settings"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Templates Tab — Firebase two-panel with inline editing ──────────────────

function TemplatesTab({
  projectId,
  templates,
  onTemplatesChange,
  authSettings,
}: {
  projectId: string;
  templates: EmailTemplates;
  onTemplatesChange: (t: EmailTemplates) => void;
  authSettings: AuthSettings;
}) {
  const [selectedKey, setSelectedKey] = React.useState<string>(
    EMAIL_TEMPLATES[0].key,
  );
  const [view, setView] = React.useState<"preview" | "edit" | "smtp">(
    "preview",
  );
  const [editSubject, setEditSubject] = React.useState("");
  const [editBody, setEditBody] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [testEmail, setTestEmail] = React.useState("");
  const [sendingTest, setSendingTest] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const selected = EMAIL_TEMPLATES.find((t) => t.key === selectedKey)!;
  const currentTemplate = templates[selectedKey] ?? { subject: "", body: "" };

  const handleSelectTemplate = (key: string) => {
    setSelectedKey(key);
    setView("preview");
    setTestResult(null);
  };

  const handleOpenEdit = () => {
    setEditSubject(currentTemplate.subject);
    setEditBody(currentTemplate.body);
    setView("edit");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/auth/templates/${selectedKey}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: editSubject, body: editBody }),
        },
      );
      if (res.ok) {
        onTemplatesChange({
          ...templates,
          [selectedKey]: { subject: editSubject, body: editBody },
        });
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setView("preview");
        }, 1200);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch(
        `/api/nosql-proxy/projects/${projectId}/auth/templates/${selectedKey}/test?to_email=${encodeURIComponent(testEmail)}`,
        { method: "POST" },
      );
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setTestResult({ ok: true, msg: `Test email sent to ${testEmail}` });
      } else {
        setTestResult({ ok: false, msg: d?.detail ?? "Failed to send" });
      }
    } catch {
      setTestResult({ ok: false, msg: "Network error" });
    } finally {
      setSendingTest(false);
    }
  };

  const filledBody = fillTemplateBody(currentTemplate.body);

  return (
    <div className="flex flex-col lg:flex-row min-h-[600px] border-t border-border">
      {/* ── Left sidebar ── */}
      <div className="w-full lg:w-[240px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-background flex flex-col">
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
            Email templates
          </p>
        </div>
        <nav className="flex flex-col">
          {EMAIL_TEMPLATES.map((tmpl) => {
            const isActive = selectedKey === tmpl.key && view !== "smtp";
            return (
              <button
                key={tmpl.key}
                onClick={() => {
                  handleSelectTemplate(tmpl.key);
                }}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] transition-colors border-l-2",
                  isActive
                    ? "bg-[--info-bg] text-[--info-text] font-medium border-brand"
                    : "text-foreground hover:bg-muted/50 border-transparent",
                )}
              >
                <MailIcon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    isActive ? "text-brand" : "text-muted-foreground",
                  )}
                />
                <span className="leading-snug line-clamp-1">{tmpl.label}</span>
              </button>
            );
          })}
        </nav>

        <Separator className="my-2" />

        <button
          onClick={() => setView("smtp")}
          className={cn(
            "flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] transition-colors border-l-2",
            view === "smtp"
              ? "bg-[--info-bg] text-[--info-text] font-medium border-brand"
              : "text-foreground hover:bg-muted/50 border-transparent",
          )}
        >
          <Settings
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              view === "smtp" ? "text-brand" : "text-muted-foreground",
            )}
          />
          SMTP settings
        </button>

        <Separator className="my-2" />

        <div className="px-4 pb-3">
          <p className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            SMS
          </p>
          <button
            disabled
            className="flex items-center gap-2.5 py-1.5 text-left text-[13px] text-muted-foreground cursor-not-allowed opacity-60 w-full"
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span>SMS verification</span>
            <Badge variant="outline" className="ml-auto text-[9px] py-0 px-1">
              SOON
            </Badge>
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 overflow-y-auto bg-muted/10">
        {/* SMTP Panel */}
        {view === "smtp" && (
          <div>
            <div className="border-b border-border bg-background px-6 py-4">
              <h2 className="text-[16px] font-medium text-foreground">
                SMTP settings
              </h2>
              <p className="text-[12.5px] text-muted-foreground mt-0.5">
                Configure a custom SMTP server to send auth emails from your own
                domain.
              </p>
            </div>
            <div className="px-6 py-5">
              <SmtpPanel
                projectId={projectId}
                initialSmtp={authSettings.smtp}
              />
            </div>
          </div>
        )}

        {/* Edit template — inline, not a dialog */}
        {view === "edit" && (
          <div>
            <div className="border-b border-border bg-background px-6 py-4 flex items-center gap-3">
              <button
                onClick={() => setView("preview")}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <span className="text-muted-foreground">/</span>
              <h2 className="text-[15px] font-medium text-foreground">
                {selected.label}
              </h2>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Variables */}
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-background px-4 py-3">
                <span className="text-[11.5px] text-muted-foreground mr-1 self-center">
                  Variables:
                </span>
                {selected.variables.map((v) => (
                  <code
                    key={v}
                    className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-foreground border border-border cursor-pointer hover:bg-muted/60"
                    onClick={() => setEditBody((prev) => prev + v)}
                    title="Click to insert"
                  >
                    {v}
                  </code>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Subject line</Label>
                <Input
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Message body</Label>
                <Textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Email body..."
                  className="text-sm font-mono min-h-[240px] resize-y leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setView("preview")}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-1.5 bg-brand text-white hover:bg-brand-hover"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : saved ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saved ? "Saved!" : "Save template"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Preview template */}
        {view === "preview" && (
          <div>
            <div className="border-b border-border bg-background px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-medium text-foreground leading-tight">
                  {selected.label}
                </h2>
                <p className="text-[12.5px] text-muted-foreground mt-0.5">
                  {selected.desc}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-[13px] text-brand hover:text-brand-hover hover:bg-[--info-bg] shrink-0"
                onClick={handleOpenEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Edit template</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Template detail card */}
              <div className="rounded-lg border border-border bg-background divide-y divide-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
                  <div className="px-5 py-3.5">
                    <p className="text-[11px] text-muted-foreground mb-1">
                      Sender name
                    </p>
                    <p className="text-[13px] text-foreground">not provided</p>
                  </div>
                  <div className="px-5 py-3.5">
                    <p className="text-[11px] text-muted-foreground mb-1">
                      From
                    </p>
                    <p className="text-[12px] text-foreground font-mono">
                      noreply@yourbaas.com
                    </p>
                  </div>
                </div>
                <div className="px-5 py-3.5">
                  <p className="text-[11px] text-muted-foreground mb-1.5">
                    Subject
                  </p>
                  <p className="text-[13px] text-foreground font-medium">
                    {currentTemplate.subject ||
                      "Verify your email for %APP_NAME%"}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Message preview
                  </p>
                  {filledBody ? (
                    <div className="space-y-1.5">
                      {filledBody.split("\n").map((line, i) => {
                        if (!line.trim())
                          return <div key={i} className="h-2" />;
                        if (
                          line.startsWith("http://") ||
                          line.startsWith("https://")
                        ) {
                          return (
                            <p
                              key={i}
                              className="text-[13px] text-blue-600 dark:text-blue-400 break-all"
                            >
                              {line}
                            </p>
                          );
                        }
                        return (
                          <p
                            key={i}
                            className="text-[13px] text-foreground leading-relaxed"
                          >
                            {line}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border px-4 py-5 text-center">
                      <p className="text-[12.5px] text-muted-foreground">
                        No message body set.{" "}
                        <button
                          className="text-brand hover:underline"
                          onClick={handleOpenEdit}
                        >
                          Edit template
                        </button>{" "}
                        to add one.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Variables */}
              <div className="rounded-lg border border-border bg-background px-5 py-4">
                <p className="text-[12px] font-medium text-foreground mb-2">
                  Available variables
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.variables.map((v) => (
                    <code
                      key={v}
                      className="rounded bg-muted px-2 py-1 text-[11px] font-mono text-foreground border border-border"
                    >
                      {v}
                    </code>
                  ))}
                </div>
              </div>

              {/* Send test email */}
              <div className="rounded-lg border border-border bg-background px-5 py-4">
                <p className="text-[13px] font-medium text-foreground mb-1">
                  Send test email
                </p>
                <p className="text-[12px] text-muted-foreground mb-3">
                  Preview this template in your inbox. Variables will be
                  replaced with sample values.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="h-9 text-sm flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendTest();
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-[13px] gap-1.5 shrink-0"
                    onClick={handleSendTest}
                    disabled={!testEmail || sendingTest}
                  >
                    {sendingTest ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Send test
                  </Button>
                </div>
                {testResult && (
                  <p
                    className={cn(
                      "text-[12px] mt-2 flex items-center gap-1.5",
                      testResult.ok
                        ? "text-[--success-text]"
                        : "text-destructive",
                    )}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5" />
                    )}
                    {testResult.msg}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
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
  initialAuthSettings,
  initialEmailTemplates,
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

  const mergedSettings: AuthSettings = {
    ...DEFAULT_SETTINGS,
    ...(initialAuthSettings ?? {}),
  };
  const [authSettings, setAuthSettings] =
    React.useState<AuthSettings>(mergedSettings);
  const [settingsDirty, setSettingsDirty] = React.useState(false);
  const [settingsSaving, setSettingsSaving] = React.useState(false);

  const [templates, setTemplates] = React.useState<EmailTemplates>(
    initialEmailTemplates ?? {
      verification: {
        subject: "Verify your email for %APP_NAME%",
        body: "Hi {{name}},\n\nFollow this link to verify your email address.\n\n{{verification_url}}\n\nIf you didn't ask to verify this address, you can ignore this email.\n\nThanks,\nYour {{app_name}} team",
      },
      password_reset: {
        subject: "Reset your password for %APP_NAME%",
        body: "Hi {{name}},\n\nFollow this link to reset your {{app_name}} password for your account.\n\n{{reset_url}}\n\nIf you didn't ask to reset your password, you can ignore this email.\n\nThanks,\nYour {{app_name}} team",
      },
      email_change: {
        subject: "Confirm your new email for %APP_NAME%",
        body: "Hi {{name}},\n\nFollow this link to confirm your new email address.\n\n{{confirmation_url}}\n\nThanks,\nYour {{app_name}} team",
      },
      magic_link: {
        subject: "Your sign-in link for %APP_NAME%",
        body: "Hi,\n\nClick the link below to sign in. This link expires in 15 minutes.\n\n{{magic_url}}\n\nThanks,\nYour {{app_name}} team",
      },
    },
  );

  const [rotateOpen, setRotateOpen] = React.useState(false);
  const [rotating, setRotating] = React.useState(false);
  const [rotated, setRotated] = React.useState(false);

  const PAGE_SIZE = 50;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const navigate = (opts: { tab?: string; search?: string; page?: number }) => {
    const p = new URLSearchParams();
    const t = opts.tab ?? activeTab;
    if (t !== "users") p.set("tab", t);
    const s = opts.search !== undefined ? opts.search : search;
    if (s) p.set("search", s);
    const pg = opts.page ?? currentPage;
    if (pg > 1) p.set("page", String(pg));
    router.push(`?${p.toString()}`);
  };

  const updateSetting = <K extends keyof AuthSettings>(
    key: K,
    value: AuthSettings[K],
  ) => {
    setAuthSettings((prev) => ({ ...prev, [key]: value }));
    setSettingsDirty(true);
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await fetch(`/api/nosql-proxy/projects/${projectId}/auth/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: authSettings }),
      });
      setSettingsDirty(false);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleRotateJWT = async () => {
    setRotating(true);
    try {
      await fetch(`/api/nosql-proxy/projects/${projectId}/auth/rotate-jwt`, {
        method: "POST",
      });
      setRotated(true);
      setTimeout(() => {
        setRotated(false);
        setRotateOpen(false);
      }, 2000);
    } finally {
      setRotating(false);
    }
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
        setUsers((p) => p.filter((u) => u.id !== user.id));
        setTotal((p) => p - 1);
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
      if (res.ok)
        setUsers((p) =>
          p.map((u) =>
            u.id === user.id ? { ...u, is_email_verified: true } : u,
          ),
        );
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-full bg-background">
        {/* Title + tabs */}
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-0 border-b border-border">
          <h1 className="text-[22px] sm:text-[28px] font-normal text-foreground tracking-tight mb-4 sm:mb-5">
            Authentication
          </h1>
          <div className="flex items-end gap-0 -mb-px overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  navigate({ tab: tab.id });
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 sm:px-4 pb-3 pt-1 text-[12.5px] sm:text-[13.5px] font-medium whitespace-nowrap border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div
          className={cn(
            "flex-1",
            activeTab === "templates" ? "" : "px-4 sm:px-8 py-5 sm:py-6",
          )}
        >
          {/* ── USERS TAB ── */}
          {activeTab === "users" && (
            <div className="space-y-4 max-w-5xl">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by email or name"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        navigate({ search: searchInput, page: 1 });
                    }}
                    className="pl-9 h-9 text-sm bg-muted/30"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => navigate({ search: searchInput, page: 1 })}
                  >
                    Search
                  </Button>
                  <Button
                    onClick={() => setAddUserOpen(true)}
                    size="sm"
                    className="h-9 px-4 gap-1.5 bg-brand text-white hover:bg-brand-hover text-[13px] font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add user
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => {
                      setRefreshing(true);
                      router.refresh();
                      setTimeout(() => setRefreshing(false), 800);
                    }}
                    disabled={refreshing}
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4 text-muted-foreground",
                        refreshing && "animate-spin",
                      )}
                    />
                  </Button>
                </div>
              </div>

              {/* Table — scrollable on mobile */}
              <div className="border border-border rounded-sm overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      {["Identifier", "Status", "Created", "User UID", ""].map(
                        (col, i) => (
                          <th
                            key={i}
                            className="px-4 py-3 text-left text-[12px] font-semibold text-foreground whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Users className="h-8 w-8 opacity-30" />
                            <p className="text-sm">
                              {search
                                ? "No users match your search."
                                : "No users yet. Add the first one."}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className="group border-b border-border/60 last:border-b-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground uppercase">
                                {user.email[0]}
                              </div>
                              <div className="min-w-0">
                                <p
                                  className="text-[13px] text-foreground truncate max-w-[160px] sm:max-w-[200px]"
                                  title={user.email}
                                >
                                  {user.email}
                                </p>
                                {user.name && (
                                  <p className="text-[11px] text-muted-foreground">
                                    {user.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
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
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-[13px] text-foreground">
                              {user.created_at
                                ? formatDate(user.created_at)
                                : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[12px] text-muted-foreground font-mono truncate max-w-[120px]"
                                title={user.id}
                              >
                                {user.id.length > 18
                                  ? user.id.slice(0, 16) + "…"
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
                          </td>
                          <td className="px-3 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger render={<span />}>
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
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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

          {/* ── SIGN-IN TAB ── */}
          {activeTab === "signin" && (
            <div className="max-w-2xl space-y-5">
              <SaveBanner
                dirty={settingsDirty}
                saving={settingsSaving}
                onSave={handleSaveSettings}
                onDiscard={() => {
                  setAuthSettings(mergedSettings);
                  setSettingsDirty(false);
                }}
              />
              <div>
                <h2 className="text-[15px] font-semibold text-foreground mb-1">
                  Sign-in providers
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Choose the sign-in methods to enable for your project.
                </p>
              </div>
              {(["native", "oauth"] as const).map((category) => (
                <div key={category}>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    {category === "native"
                      ? "Native providers"
                      : "OAuth providers"}
                  </p>
                  <div className="border border-border rounded-sm overflow-hidden divide-y divide-border/60">
                    {SIGN_IN_PROVIDERS.filter(
                      (p) => p.category === category,
                    ).map((provider) => {
                      const Icon = provider.icon;
                      const enabled =
                        authSettings.providers[
                          provider.id as keyof typeof authSettings.providers
                        ] ?? false;
                      return (
                        <div
                          key={provider.id}
                          className="flex items-center gap-3 sm:gap-4 px-4 py-3.5 bg-background hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-medium text-foreground">
                                {provider.label}
                              </span>
                              {provider.badge && (
                                <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                                  {provider.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11.5px] text-muted-foreground mt-0.5 hidden sm:block">
                              {provider.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={cn(
                                "text-[11px] font-medium hidden sm:block",
                                enabled
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground",
                              )}
                            >
                              {enabled ? "Enabled" : "Disabled"}
                            </span>
                            <Switch
                              checked={enabled}
                              onCheckedChange={(v) => {
                                updateSetting("providers", {
                                  ...authSettings.providers,
                                  [provider.id]: v,
                                });
                              }}
                              disabled={!!provider.badge}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TEMPLATES TAB ── */}
          {activeTab === "templates" && (
            <TemplatesTab
              projectId={projectId}
              templates={templates}
              onTemplatesChange={setTemplates}
              authSettings={authSettings}
            />
          )}

          {/* ── USAGE TAB ── */}
          {activeTab === "usage" && (
            <div className="max-w-2xl space-y-4">
              <div>
                <h2 className="text-[15px] font-semibold text-foreground mb-1">
                  Authentication usage
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Live stats from your project database.
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
            <div className="max-w-2xl space-y-5">
              <SaveBanner
                dirty={settingsDirty}
                saving={settingsSaving}
                onSave={handleSaveSettings}
                onDiscard={() => {
                  setAuthSettings(mergedSettings);
                  setSettingsDirty(false);
                }}
              />
              <div>
                <h2 className="text-[15px] font-semibold text-foreground mb-1">
                  Auth settings
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Configure authentication behaviour for your project.
                </p>
              </div>

              <div className="border border-border rounded-sm overflow-hidden divide-y divide-border/60">
                {[
                  {
                    key: "allow_signups" as const,
                    label: "Allow new sign-ups",
                    desc: "When disabled, only existing users can sign in.",
                  },
                  {
                    key: "require_email_verification" as const,
                    label: "Require email verification",
                    desc: "Send a confirmation email before granting access.",
                  },
                  {
                    key: "allow_multiple_sessions" as const,
                    label: "Allow multiple sessions",
                    desc: "Users can be signed in on multiple devices simultaneously.",
                  },
                ].map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between px-4 py-4 bg-background"
                  >
                    <div className="pr-4">
                      <p className="text-[13px] font-medium text-foreground">
                        {s.label}
                      </p>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5 hidden sm:block">
                        {s.desc}
                      </p>
                    </div>
                    <Switch
                      checked={authSettings[s.key] as boolean}
                      onCheckedChange={(v) => updateSetting(s.key, v)}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-4 bg-background">
                  <div className="pr-4">
                    <p className="text-[13px] font-medium text-foreground">
                      Session duration
                    </p>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5 hidden sm:block">
                      How long before a user must sign in again.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      value={authSettings.session_duration_hours}
                      onChange={(e) =>
                        updateSetting(
                          "session_duration_hours",
                          parseInt(e.target.value) || 168,
                        )
                      }
                      className="h-8 w-20 text-sm text-right"
                      min={1}
                    />
                    <span className="text-[12px] text-muted-foreground">
                      hrs
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-4 bg-background">
                  <div className="pr-4">
                    <p className="text-[13px] font-medium text-foreground">
                      Min. password length
                    </p>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5 hidden sm:block">
                      Enforce a minimum character count for new passwords.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Input
                      type="number"
                      value={authSettings.min_password_length}
                      onChange={(e) =>
                        updateSetting(
                          "min_password_length",
                          parseInt(e.target.value) || 8,
                        )
                      }
                      className="h-8 w-20 text-sm text-right"
                      min={6}
                      max={128}
                    />
                    <span className="text-[12px] text-muted-foreground">
                      chars
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-[13px] font-semibold text-destructive">
                  Danger zone
                </h3>
                <div className="border border-destructive/30 rounded-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-4">
                    <div>
                      <p className="text-[13px] font-medium">
                        Rotate JWT secret
                      </p>
                      <p className="text-[11.5px] text-muted-foreground mt-0.5">
                        All existing tokens will be immediately invalidated.
                        Users will need to sign in again.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs shrink-0 gap-1.5 self-start sm:self-auto"
                      onClick={() => setRotateOpen(true)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Rotate secret
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dialogs */}
        <AddUserDialog
          open={addUserOpen}
          onClose={() => setAddUserOpen(false)}
          projectId={projectId}
          dbSchema={dbSchema}
          onCreated={(u) => {
            setUsers((p) => [u as any, ...p]);
            setTotal((p) => p + 1);
          }}
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

        <Dialog open={rotateOpen} onOpenChange={setRotateOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <ServerCrash className="h-5 w-5" />
                Rotate JWT secret
              </DialogTitle>
              <DialogDescription>
                This will immediately invalidate{" "}
                <strong>all existing tokens</strong> for this project. Every
                signed-in user will be logged out. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotateOpen(false)}
                disabled={rotating}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRotateJWT}
                disabled={rotating}
                className="gap-1.5"
              >
                {rotating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : rotated ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                {rotated ? "Rotated!" : "Yes, rotate secret"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
