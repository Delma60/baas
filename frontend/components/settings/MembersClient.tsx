// frontend/components/settings/MembersClient.tsx
"use client";

import * as React from "react";
import { Search, UserPlus, Crown, User, Loader2, AlertTriangle, MoreVertical, Trash2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  email: string;
  name: string;
  role: "owner" | "member";
  created_at: string;
}

interface Props {
  projectId: string;
  userId: string;
  initialMembers: Member[];
  currentUserId: string;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function MemberAvatar({ name, email }: { name: string; email: string }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  // Deterministic color from email
  const colors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500",
    "bg-red-500", "bg-yellow-500", "bg-pink-500", "bg-indigo-500",
  ];
  const colorIndex = email.charCodeAt(0) % colors.length;

  return (
    <div className={cn(
      "h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0",
      colors[colorIndex]
    )}>
      {initials}
    </div>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: (email: string) => Promise<void> }) {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onInvite(email.trim());
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Failed to invite member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h3 className="text-base font-semibold text-text-primary">Add member</h3>
          <p className="text-[13px] text-text-muted mt-0.5">
            Invite a team member to collaborate on this project
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-[12.5px] text-danger-text">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              autoFocus
              className="w-full h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Role</label>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
              <Shield className="h-4 w-4 text-text-muted" />
              <div>
                <p className="text-sm font-medium text-text-primary">Member</p>
                <p className="text-[11px] text-text-muted">Can view and edit all project resources</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 h-9 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MembersClient({ projectId, userId, initialMembers, currentUserId }: Props) {
  const [members, setMembers] = React.useState<Member[]>(initialMembers);
  const [search, setSearch] = React.useState("");
  const [showInvite, setShowInvite] = React.useState(false);
  const [actionMenu, setActionMenu] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async (email: string) => {
    // In current arch, org members are managed via org — call the backend
    const res = await fetch(`/api/internal/settings/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, email }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error ?? "Failed to invite member");
    }
    // Optimistic: add as member
    setMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        email,
        name: email.split("@")[0],
        role: "member",
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this member from the project?")) return;
    setRemoving(memberId);
    setError(null);
    try {
      const res = await fetch(`/api/internal/settings/members/${memberId}?projectId=${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? "Failed to remove member");
      }
    } finally {
      setRemoving(null);
      setActionMenu(null);
    }
  };

  const serviceAccountCount = members.filter((m) => m.role === "member").length;

  return (
    <div>
      {showInvite && (
        <InviteModal onClose={() => setShowInvite(false)} onInvite={handleInvite} />
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-danger-bg border border-danger/20 px-4 py-3 text-sm text-danger-text flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Search + add */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 flex-1 rounded-lg border border-border bg-surface px-3 h-9">
            <Search className="h-3.5 w-3.5 text-text-muted shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors shrink-0"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add member
          </button>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 px-4 py-2 border-b border-border">
          <div className="col-span-7 flex items-center gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Member</span>
          </div>
          <div className="col-span-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Roles</span>
          </div>
          <div className="col-span-2 text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Actions</span>
          </div>
        </div>

        {/* Member rows */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-text-muted">
              {search ? "No members match your search" : "No members yet"}
            </p>
          </div>
        ) : (
          filtered.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-12 px-4 py-3 border-b border-border last:border-0 items-center hover:bg-surface/50 transition-colors"
            >
              <div className="col-span-7 flex items-center gap-3">
                <MemberAvatar name={member.name} email={member.email} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {member.name || member.email.split("@")[0]}
                    {member.id === currentUserId && (
                      <span className="ml-1.5 text-[10px] font-semibold text-text-muted">(you)</span>
                    )}
                  </p>
                  <p className="text-[12px] text-text-muted truncate">{member.email}</p>
                </div>
              </div>
              <div className="col-span-3">
                {member.role === "owner" ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-text-primary">Owner</span>
                    <Crown className="h-3.5 w-3.5 text-brand" />
                  </div>
                ) : (
                  <span className="text-sm text-text-primary">Member</span>
                )}
              </div>
              <div className="col-span-2 flex justify-end">
                {member.role !== "owner" && member.id !== currentUserId && (
                  <div className="relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === member.id ? null : member.id)}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {actionMenu === member.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                        <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-border bg-background shadow-lg py-1 overflow-hidden">
                          <button
                            onClick={() => handleRemove(member.id)}
                            disabled={removing === member.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-text hover:bg-danger-bg transition-colors"
                          >
                            {removing === member.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5" />}
                            Remove member
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Footer */}
        {serviceAccountCount > 0 && (
          <div className="px-4 py-3 border-t border-border">
            <p className="text-[12px] text-text-muted">
              <span className="text-brand font-medium">{serviceAccountCount} service account{serviceAccountCount !== 1 ? "s" : ""}</span>
              {" "}also have access to this project via API keys
            </p>
          </div>
        )}
      </div>

      {/* Advanced permissions note */}
      <div className="mt-4 flex justify-end">
        <p className="text-[12px] text-text-muted">
          Access is determined by organization membership and API key permissions.{" "}
          <a href="#" className="text-brand hover:underline">Learn more</a>
        </p>
      </div>
    </div>
  );
}