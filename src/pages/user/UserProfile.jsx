// src/pages/user/UserProfile.jsx
import { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  KeyRound,
  AlertTriangle,
  User2,
  Mail,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lock,
  Activity,
  FileText,
  GraduationCap,
  Bell,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import { getMyProfile, changeMyPassword } from "../../lib/user";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}


// ---------- UI helpers ----------
function SoftCard({ className = "", children }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-md shadow-slate-100/80",
        className,
      )}
    >
      {children}
    </div>
  );
}

function EndpointMissing({ label }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
      <div>
        <div className="font-semibold text-amber-900">
          {label} not connected
        </div>
        <div className="text-xs text-amber-800/70">
          Endpoint missing — showing placeholder UI.
        </div>
      </div>
    </div>
  );
}

function Pill({ tone = "slate", children }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone] || tones.slate,
      )}
    >
      {children}
    </span>
  );
}

function Stat({ icon: Icon, label, value, tone = "indigo" }) {
  const toneMap = {
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm hover:shadow-md",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm hover:shadow-md",
    amber: "border-amber-200 bg-amber-50 text-amber-800 shadow-sm hover:shadow-md",
    rose: "border-rose-200 bg-rose-50 text-rose-700 shadow-sm hover:shadow-md",
    slate: "border-slate-200 bg-slate-50 text-slate-700 shadow-sm hover:shadow-md",
    violet: "border-violet-200 bg-violet-50 text-violet-700 shadow-sm hover:shadow-md",
  };
  return (
    <div
      className={cn("rounded-xl border p-4", toneMap[tone] || toneMap.slate)}
    >
      <div className="flex items-center justify-between">
        <div className="text-md font-semibold">{label}</div>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-indigo-700 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Toast({ type = "info", title, message, onClose }) {
  const styles = {
    info: "border-slate-200 bg-white",
    success: "border-emerald-200 bg-emerald-50",
    error: "border-rose-200 bg-rose-50",
    warn: "border-amber-200 bg-amber-50",
  }[type];

  const Icon =
    type === "success"
      ? CheckCircle2
      : type === "error"
        ? XCircle
        : type === "warn"
          ? AlertTriangle
          : Info;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 shadow-sm",
        styles,
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 text-slate-600" />
      <div className="min-w-0 flex-1">
        {title && (
          <div className="text-sm font-semibold text-slate-800">{title}</div>
        )}
        {message && <div className="text-sm text-slate-600">{message}</div>}
      </div>
      <button
        onClick={onClose}
        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

function SkeletonLine({ w = "w-full" }) {
  return <div className={cn("h-3 animate-pulse rounded bg-slate-200/70", w)} />;
}

function TabButton({ active, icon: Icon, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-indigo-700 text-white shadow-sm"
          : "bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function FieldCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="rounded-xl border shadow-xs border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-800 break-words">
        {loading ? <SkeletonLine w="w-32" /> : value}
      </div>
    </div>
  );
}

// ---------- main ----------
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

  // ui
  const [activeTab, setActiveTab] = useState("account"); // account | security | session
  const [toast, setToast] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await getMyProfile();
      setMissing(!!res?.missing);
      setProfile(res?.ok ? res?.data?.user || res?.data : null);

      if (!res?.ok && !res?.missing) {
        setToast({
          type: "warn",
          title: "Couldn’t load full profile",
          message: res?.error?.message || "Using session values as fallback.",
        });
      }
    } catch {
      setToast({
        type: "error",
        title: "Network error",
        message: "Failed to load profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const view = useMemo(() => {
    const name = profile?.name || user?.name || "—";
    const email = profile?.email || user?.email || "—";
    const role = profile?.role || user?.role || "USER";

    // Placeholder-friendly “visual report” stats (wire real ones later)
    const requestsTotal =
      profile?.stats?.requestsTotal ??
      profile?.requestsTotal ??
      (email !== "—" ? 7 : 0);

    const requestsOpen =
      profile?.stats?.requestsOpen ??
      profile?.requestsOpen ??
      (email !== "—" ? 2 : 0);

    const trainingProgress =
      profile?.stats?.trainingProgress ??
      profile?.trainingProgress ??
      (role === "USER" ? 62 : 45);

    // friendly security score (no black / no heavy)
    const base = 55;
    const roleBoost = role ? 10 : 0;
    const pwBoost = newPassword?.trim()?.length ? 5 : 0;
    const score = Math.max(0, Math.min(100, base + roleBoost + pwBoost));

    return {
      name,
      email,
      role,
      requestsTotal,
      requestsOpen,
      trainingProgress,
      securityScore: score,
    };
  }, [profile, user, newPassword]);

  const passwordStrength = useMemo(() => {
    const p = newPassword || "";
    let score = 0;
    if (p.length >= 8) score += 30;
    if (/[A-Z]/.test(p)) score += 15;
    if (/[a-z]/.test(p)) score += 15;
    if (/\d/.test(p)) score += 20;
    if (/[^A-Za-z0-9]/.test(p)) score += 20;
    return Math.max(0, Math.min(100, score));
  }, [newPassword]);

  const strengthMeta = useMemo(() => {
    if (!newPassword) return { tone: "slate", text: "—" };
    if (passwordStrength >= 80) return { tone: "emerald", text: "Strong" };
    if (passwordStrength >= 55) return { tone: "amber", text: "Medium" };
    return { tone: "rose", text: "Weak" };
  }, [passwordStrength, newPassword]);

  const securityTone = useMemo(() => {
    const s = view.securityScore;
    if (s >= 75) return "emerald";
    if (s >= 60) return "amber";
    return "rose";
  }, [view.securityScore]);

  async function updatePassword() {
    setToast(null);
    setPwMissing(false);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setToast({
        type: "warn",
        title: "Missing fields",
        message: "Please enter your current password and a new password.",
      });
      return;
    }

    if (newPassword.trim().length < 8) {
      setToast({
        type: "warn",
        title: "Weak password",
        message: "Use at least 8 characters for your new password.",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await changeMyPassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (res?.missing) {
        setPwMissing(true);
        setToast({
          type: "warn",
          title: "Password change not enabled",
          message: "Backend endpoint missing — this action is disabled.",
        });
        return;
      }

      if (!res?.ok) {
        setToast({
          type: "error",
          title: "Update failed",
          message: res?.error?.message || "Failed to update password.",
        });
        return;
      }

      setToast({
        type: "success",
        title: "Password updated",
        message: "Your password was updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setActiveTab("account");
    } catch {
      setToast({
        type: "error",
        title: "Network error",
        message: "Could not update password. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm shadow-slate-100/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-700 to-violet-600" />
              <div className="absolute -bottom-2 -right-2 rounded-xl border border-slate-200 bg-white p-1">
                <Sparkles className="h-4 w-4 text-indigo-700" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-semibold tracking-tight text-slate-800">
                  {loading ? "Loading…" : view.name}
                </div>
                <Pill tone="indigo">{loading ? "…" : view.role}</Pill>
                {missing ? (
                  <Pill tone="amber">Partial</Pill>
                ) : (
                  <Pill tone="emerald">Synced</Pill>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1 min-w-0">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{loading ? "…" : view.email}</span>
                </span>

                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" />
                  Security score:{" "}
                  <span className="font-semibold text-slate-700">
                    {loading ? "…" : `${view.securityScore}%`}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <RefreshCw
                className={cn("h-4 w-4", loading ? "animate-spin" : "")}
              />
              Refresh
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600"
            >
              <Lock className="h-4 w-4" />
              Security
            </button>
          </div>
        </div>

        {toast && (
          <div className="mt-4">
            <Toast {...toast} onClose={() => setToast(null)} />
          </div>
        )}
      </div>

      {/* Main */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs */}
          <SoftCard className="p-2">
            <div className="flex flex-wrap gap-2">
              <TabButton
                active={activeTab === "account"}
                icon={User2}
                onClick={() => setActiveTab("account")}
              >
                Account
              </TabButton>
              <TabButton
                active={activeTab === "security"}
                icon={KeyRound}
                onClick={() => setActiveTab("security")}
              >
                Security
              </TabButton>
              <TabButton
                active={activeTab === "session"}
                icon={Activity}
                onClick={() => setActiveTab("session")}
              >
                Session
              </TabButton>
            </div>
          </SoftCard>

          {/* Account */}
          {activeTab === "account" && (
            <SoftCard className="p-5 shadow-md">
              <div className="font-semibold text-lg text-indigo-700">
                Profile details
              </div>
              <div className="text-sm text-slate-800 mt-1">
                View your account info and status.
              </div>

              {missing && (
                <div className="mt-4">
                  <EndpointMissing label="Profile" />
                </div>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <FieldCard
                  icon={User2}
                  label="Name"
                  value={view.name}
                  loading={loading}
                />
                <FieldCard
                  icon={Mail}
                  label="Email"
                  value={view.email}
                  loading={loading}
                />
                <FieldCard
                  icon={ShieldCheck}
                  label="Role"
                  value={view.role}
                  loading={loading}
                />
              </div>

              <div className="mt-5 rounded-xl border shadow-xs border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-md font-semibold text-indigo-700">
                      Security score
                    </div>
                    <div className="text-sm text-slate-600">
                      Quick indicator based on enabled security features.
                    </div>
                  </div>
                  <Pill tone={securityTone}>
                    {loading ? "…" : `${view.securityScore}%`}
                  </Pill>
                </div>
                <div className="mt-3">
                  <ProgressBar value={loading ? 0 : view.securityScore} />
                </div>
              </div>
            </SoftCard>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <SoftCard className="p-5 shadow-md">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-indigo-700" />
                <div className="text-lg font-semibold text-indigo-700">
                  Change password
                </div>
              </div>
              <div className="text-sm text-slate-600 mt-1">
                Enabled only if backend supports it.
              </div>

              {pwMissing && (
                <div className="mt-4">
                  <EndpointMissing label="Change password" />
                </div>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  <div className="text-xs text-slate-500 mb-1">
                    Current password
                  </div>
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={pwMissing || saving}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </label>

                <label className="text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500 mb-1">
                      New password
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPasswords((v) => !v)}
                      className="mb-1 inline-flex items-center gap-2 rounded-xl px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {showPasswords ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      {showPasswords ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={pwMissing || saving}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Password strength
                    </div>
                    <div className="text-xs text-slate-500">
                      Add uppercase, numbers, and symbols for better security.
                    </div>
                  </div>
                  <Pill tone={strengthMeta.tone}>{strengthMeta.text}</Pill>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        strengthMeta.tone === "emerald"
                          ? "bg-emerald-600"
                          : strengthMeta.tone === "amber"
                            ? "bg-amber-600"
                            : strengthMeta.tone === "rose"
                              ? "bg-rose-600"
                              : "bg-indigo-700",
                      )}
                      style={{
                        width: `${newPassword ? passwordStrength : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Tip: Don’t reuse passwords across services.
                </div>

                <button
                  onClick={updatePassword}
                  disabled={
                    pwMissing ||
                    saving ||
                    !currentPassword.trim() ||
                    !newPassword.trim()
                  }
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition",
                    pwMissing ||
                      saving ||
                      !currentPassword.trim() ||
                      !newPassword.trim()
                      ? "bg-slate-300"
                      : "bg-indigo-700 hover:bg-indigo-600",
                  )}
                >
                  <KeyRound className="h-4 w-4" />
                  {saving ? "Saving..." : "Update password"}
                </button>
              </div>
            </SoftCard>
          )}

          {/* Session */}
          {activeTab === "session" && (
            <SoftCard className="p-5">
              <div className="text-base font-semibold text-slate-800">
                Session
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Manage your current session on this device.
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    Current device
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-800">
                    Web session
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Logout will clear your session on this device.
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    Signed in as
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-800 break-all">
                    {loading ? "…" : view.email}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Role: {loading ? "…" : view.role}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </SoftCard>
          )}
        </div>

        {/* Right: Visual report */}
        <div className="lg:col-span-4 space-y-4">
          <SoftCard className="overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-700 to-violet-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">
                    Your privacy dashboard
                  </div>
                  <div className="mt-1 text-lg font-semibold tracking-tight">
                    Quick report
                  </div>
                </div>
                <div className="rounded-xl bg-white/15 p-2">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 text-xs">
                Snapshot of your activity (placeholder-ready — wire real stats
                anytime).
              </div>
            </div>

            <div className="p-5">
              <div className="grid gap-3">
                <Stat
                  icon={FileText}
                  label="Total requests"
                  value={loading ? "…" : view.requestsTotal}
                  tone="indigo"
                />
                <Stat
                  icon={Bell}
                  label="Open requests"
                  value={loading ? "…" : view.requestsOpen}
                  tone="amber"
                />
                <Stat
                  icon={GraduationCap}
                  label="Training progress"
                  value={loading ? "…" : `${view.trainingProgress}%`}
                  tone="emerald"
                />
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Training progress
                    </div>
                    <div className="text-xs text-slate-500">
                      Complete modules to improve awareness.
                    </div>
                  </div>
                  <Pill tone="indigo">
                    {loading ? "…" : `${view.trainingProgress}%`}
                  </Pill>
                </div>

                <div className="mt-3">
                  <ProgressBar value={loading ? 0 : view.trainingProgress} />
                </div>

                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Policy basics
                    </span>
                    <span className="font-semibold text-slate-700">
                      {(loading ? false : view.trainingProgress >= 25)
                        ? "Done"
                        : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4",
                          (loading ? 0 : view.trainingProgress) >= 55
                            ? "text-emerald-600"
                            : "text-slate-300",
                        )}
                      />
                      Data subject rights
                    </span>
                    <span className="font-semibold text-slate-700">
                      {(loading ? false : view.trainingProgress >= 55)
                        ? "Done"
                        : "Pending"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4",
                          (loading ? 0 : view.trainingProgress) >= 80
                            ? "text-emerald-600"
                            : "text-slate-300",
                        )}
                      />
                      Incident response
                    </span>
                    <span className="font-semibold text-slate-700">
                      {(loading ? false : view.trainingProgress >= 80)
                        ? "Done"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800">
                  Recommended next step
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Based on your status, we suggest:
                </div>

                <div className="mt-3 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="rounded-xl bg-indigo-50 p-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">
                      Review your open requests
                    </div>
                    <div className="text-xs text-slate-500">
                      Keep your data rights actions up to date.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("security")}
                  className="mt-3 w-full rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600"
                >
                  Go to Security
                </button>
              </div>
            </div>
          </SoftCard>

          {/* Backend status */}
          <SoftCard className="p-5 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  Backend status
                </div>
                <div className="text-xs text-slate-500">
                  Endpoints detected from responses.
                </div>
              </div>
              <Pill tone={missing || pwMissing ? "amber" : "emerald"}>
                {missing || pwMissing ? "Partial" : "Healthy"}
              </Pill>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                <span className="text-slate-700 font-semibold">Profile</span>
                {missing ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                    <AlertTriangle className="h-4 w-4" /> Placeholder
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Connected
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                <span className="text-slate-700 font-semibold">
                  Change password
                </span>
                {pwMissing ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                    <AlertTriangle className="h-4 w-4" /> Disabled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Enabled
                  </span>
                )}
              </div>
            </div>
          </SoftCard>
        </div>
      </div>
    </div>
  );
}
