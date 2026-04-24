"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { X, UserPlus, Users } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((r) => r.data);

type Role = "OWNER" | "EDITOR" | "VIEWER";

interface Member {
  id: string;
  role: Role;
  user: { id: string; name: string | null; email: string };
}

const ROLE_BADGE: Record<Role, string> = {
  OWNER: "bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-700",
  EDITOR: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:ring-violet-700",
  VIEWER: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
};

function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${ROLE_BADGE[role]}`}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}

interface CollaboratorsPanelProps {
  tripId: string;
  isOwner: boolean;
  ownerName?: string | null;
  ownerEmail?: string;
}

export function CollaboratorsPanel({ tripId, isOwner, ownerName, ownerEmail }: CollaboratorsPanelProps) {
  const membersKey = `/api/trips/${tripId}/members`;
  const { data: members, isLoading } = useSWR<Member[]>(isOwner ? membersKey : null, fetcher);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("VIEWER");
  const [inviting, setInviting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/trips/${tripId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Failed to invite member");
      } else {
        setSuccessMsg(`${json.data.user.name ?? json.data.user.email} was invited as ${role.toLowerCase()}`);
        setEmail("");
        await mutate(membersKey);
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(memberId: string) {
    const res = await fetch(`/api/trips/${tripId}/members/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      await mutate(membersKey);
    }
  }

  async function handleRoleChange(memberId: string, newRole: "EDITOR" | "VIEWER") {
    await fetch(`/api/trips/${tripId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    await mutate(membersKey);
  }

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800 dark:bg-zinc-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        </div>
        <div>
          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Collaborators</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">People with access to this trip</p>
        </div>
      </div>

      {/* Owner row (always visible) */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5">
          <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {(ownerName ?? ownerEmail ?? "O").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {ownerName ?? ownerEmail ?? "Owner"}
              {isOwner && <span className="ml-1.5 text-xs text-zinc-400">(you)</span>}
            </p>
            {ownerName && ownerEmail && (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 truncate">{ownerEmail}</p>
            )}
          </div>
          <RoleBadge role="OWNER" />
        </div>

        {/* Member rows */}
        {isOwner && (
          <>
            {isLoading && (
              <p className="text-xs text-zinc-400 px-3 py-2">Loading members…</p>
            )}
            {members?.map((m) => (
              <div key={m.id} className="group flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5">
                <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    {(m.user.name ?? m.user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {m.user.name ?? m.user.email}
                  </p>
                  {m.user.name && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-600 truncate">{m.user.email}</p>
                  )}
                </div>
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value as "EDITOR" | "VIEWER")}
                  className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                </select>
                <button
                  onClick={() => handleRemove(m.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  title="Remove member"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Invite form — owner only */}
      {isOwner && (
        <form onSubmit={handleInvite} className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
            Invite someone
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); setSuccessMsg(""); }}
              placeholder="colleague@email.com"
              required
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {inviting ? "Inviting…" : "Invite"}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-500 dark:text-red-400 px-1">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 px-1">{successMsg}</p>
          )}
        </form>
      )}
    </div>
  );
}
