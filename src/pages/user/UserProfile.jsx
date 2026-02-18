// src/pages/user/UserProfile.jsx
import { useEffect, useMemo, useState } from "react";
import { LogOut, KeyRound, AlertTriangle } from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { getMyProfile, changeMyPassword } from "../../lib/user";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function SoftCard({ className = "", children }) {
  return (
    <div
      className={cn("rounded-xl border border-slate-200 bg-white", className)}
    >
      {children}
    </div>
  );
}

function EndpointMissing({ label }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
      <div>
        <div className="text-slate-700 font-semibold">
          {label} not connected
        </div>
        <div className="text-xs text-slate-500">
          Endpoint missing — showing placeholder UI.
        </div>
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { user, logout } = useAuth() || {};
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [profile, setProfile] = useState(null);

  // password
  const [pwMissing, setPwMissing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  async function load() {
    setLoading(true);
    const res = await getMyProfile();
    setMissing(!!res.missing);
    setProfile(res.ok ? res.data?.user || res.data : null);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const view = useMemo(() => {
    return {
      name: profile?.name || user?.name || "—",
      email: profile?.email || user?.email || "—",
      role: profile?.role || user?.role || "USER",
    };
  }, [profile, user]);

  async function updatePassword() {
    setPwMsg("");
    setPwMissing(false);
    if (!currentPassword.trim() || !newPassword.trim()) return;

    setSaving(true);
    const res = await changeMyPassword({ currentPassword, newPassword });
    setSaving(false);

    if (res.missing) return setPwMissing(true);
    if (!res.ok)
      return setPwMsg(res.error?.message || "Failed to update password");

    setPwMsg("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <div className="space-y-4">
      <SoftCard className="p-5">
        <div className="text-base font-semibold text-slate-800">Profile</div>
        <div className="text-sm text-slate-500 mt-1">
          View your account info and settings.
        </div>

        {missing && (
          <div className="mt-4">
            <EndpointMissing label="Profile" />
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Name</div>
            <div className="mt-1 text-sm font-semibold text-slate-700">
              {loading ? "Loading…" : view.name}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Email</div>
            <div className="mt-1 text-sm font-semibold text-slate-700">
              {loading ? "Loading…" : view.email}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">Role</div>
            <div className="mt-1 text-sm font-semibold text-slate-700">
              {loading ? "Loading…" : view.role}
            </div>
          </div>
        </div>
      </SoftCard>

      <SoftCard className="p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-slate-600" />
          <div className="text-sm font-semibold text-slate-700">
            Change password
          </div>
        </div>
        <div className="text-sm text-slate-500 mt-1">
          Enabled only if backend supports it.
        </div>

        {pwMissing && (
          <div className="mt-4">
            <EndpointMissing label="Change password" />
          </div>
        )}
        {pwMsg && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            {pwMsg}
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="text-xs text-slate-500 mb-1">Current password</div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={pwMissing}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="••••••••"
            />
          </label>

          <label className="text-sm">
            <div className="text-xs text-slate-500 mb-1">New password</div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={pwMissing}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="••••••••"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={updatePassword}
            disabled={
              pwMissing ||
              saving ||
              !currentPassword.trim() ||
              !newPassword.trim()
            }
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white",
              pwMissing ||
                saving ||
                !currentPassword.trim() ||
                !newPassword.trim()
                ? "bg-slate-300"
                : "bg-blue-600 hover:bg-blue-700",
            )}
          >
            {saving ? "Saving..." : "Update password"}
          </button>
        </div>
      </SoftCard>

      <SoftCard className="p-5 bg-slate-50">
        <div className="text-sm font-semibold text-slate-700">Logout</div>
        <div className="text-sm text-slate-500 mt-1">
          This will clear your session on this device.
        </div>

        <button
          onClick={logout}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </SoftCard>
    </div>
  );
}
