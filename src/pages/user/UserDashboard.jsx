// src/pages/user/UserDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  RefreshCw,
  ShieldAlert,
  FileText,
  GraduationCap,
  AlertTriangle,
  Flame,
  Eye,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import {
  getMySummary,
  listMyActivity,
  createMyCase,
  listMyCases,
} from "../../lib/user";

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Surface({ className = "", children }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Skeleton({ className = "" }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-slate-200/60", className)}
    />
  );
}

function EndpointMissing({ label }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
      <div>
        <div className="text-sm font-semibold text-slate-800">
          {label} not connected
        </div>
        <div className="mt-0.5 text-sm text-slate-600">
          Endpoint missing — showing placeholder UI.
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-lg font-semibold text-indigo-700">{title}</div>
        {subtitle && (
          <div className="mt-1 text-sm font-medium text-slate-700">
            {subtitle}
          </div>
        )}
      </div>
      {right}
    </div>
  );
}

/**
 * KPI card like your screenshot:
 * - pastel background
 * - icon bubble
 * - value + percent line
 * - progress bar
 */
function KpiCard({
  title,
  subtitle,
  value,
  percentLabel,
  icon: Icon,
  tone = "indigo",
  onClick,
}) {
  const toneMap = {
    indigo: {
      shell:
        "border-indigo-200 bg-indigo-50/40 from-indigo-500/15 to-emerald-500/10",
      bubble: "text-indigo-700",
      bar: "bg-indigo-600",
      barTrack: "bg-indigo-200/60",
      title: "text-indigo-800",
      sub: "text-indigo-700/80",
    },
    amber: {
      shell:
        "border-amber-200 bg-amber-50/50 from-amber-500/15 to-indigo-500/10",
      bubble: "text-amber-800",
      bar: "bg-amber-600",
      barTrack: "bg-amber-200/60",
      title: "text-amber-900",
      sub: "text-amber-700/80",
    },
    sky: {
      shell: "border-sky-200 bg-sky-50/50 from-emerald-500/15 to-sky-400/10",
      bubble: "text-sky-800",
      bar: "bg-sky-600",
      barTrack: "bg-sky-200/60",
      title: "text-sky-900",
      sub: "text-sky-700/80",
    },
    rose: {
      shell: "border-rose-200 bg-rose-50/50 from-rose-500/15 to-amber-400/10",
      bubble: "text-rose-800",
      bar: "bg-rose-600",
      barTrack: "bg-rose-200/60",
      title: "text-rose-900",
      sub: "text-rose-700/80",
    },
    emerald: {
      shell: "border-emerald-200 bg-emerald-50/55",
      bubble: "text-emerald-800",
      bar: "bg-emerald-600",
      barTrack: "bg-emerald-200/60",
      title: "text-emerald-900",
      sub: "text-emerald-700/80",
    },
  };

  const t = toneMap[tone] || toneMap.indigo;
  const pct = Number.isFinite(Number(percentLabel?.value))
    ? Number(percentLabel.value)
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border p-4 text-left bg-gradient-to-br shadow-sm transition hover:shadow-md",
        t.shell,
        "transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-indigo-300/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={cn("text-sm font-bold", t.title)}>{title}</div>
          <div className={cn("mt-1 text-sm", t.sub)}>{subtitle}</div>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center", t.bubble)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className={cn("text-3xl font-semibold leading-none", t.title)}>
          {value}
        </div>
        <div className="text-sm font-semibold text-slate-600">
          {percentLabel?.text || ""}
        </div>
      </div>

      <div className={cn("mt-3 h-2 w-full rounded-full", t.barTrack)}>
        <div
          className={cn("h-2 rounded-full", t.bar)}
          style={{
            width: pct == null ? "0%" : `${Math.max(0, Math.min(100, pct))}%`,
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/45 to-transparent" />
    </button>
  );
}

function CreateRequestModal({ open, onClose, onCreated }) {
  const [type, setType] = useState("DSR");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [missing, setMissing] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit = title.trim() && description.trim() && type.trim();

  useEffect(() => {
    if (!open) {
      setType("DSR");
      setTitle("");
      setDescription("");
      setSubmitting(false);
      setMissing(false);
      setErr("");
    }
  }, [open]);

  async function submit() {
    setErr("");
    setMissing(false);
    if (!canSubmit) return;

    setSubmitting(true);
    const res = await createMyCase({ type, title, description });
    setSubmitting(false);

    if (res.missing) {
      setMissing(true);
      return;
    }
    if (!res.ok) {
      setErr(res.error?.message || "Failed");
      return;
    }

    const createdId = res.data?.id || res.data?.case?.id || res.data?.data?.id;
    if (createdId) onCreated(createdId);
    else onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-[0_20px_60px_rgba(2,6,23,0.25)]">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="text-lg font-semibold text-indigo-700">
            Create a Request
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Submit a request and track updates. You can add details later in
            comments.
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {missing && <EndpointMissing label="Create request" />}
          {err && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              {err}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="text-sm font-semibold text-slate-700 mb-1">
                Type
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200/50"
              >
                <option value="DSR">DSR (Data Subject Request)</option>
                <option value="INCIDENT">Incident report</option>
                <option value="VENDOR">Vendor request</option>
                <option value="QUESTION">General privacy question</option>
              </select>
              <div className="mt-1 text-sm text-slate-500">
                “Privacy question” will be stored as POLICY until you add
                QUESTION enum.
              </div>
            </label>

            <label className="block">
              <div className="text-sm font-semibold text-slate-700 mb-1">
                Title
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200/50"
                placeholder="Short title"
              />
            </label>
          </div>

          <label className="block">
            <div className="text-sm font-semibold text-slate-700 mb-1">
              Description
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200/50"
              placeholder="Explain what happened / what you need / any deadline"
            />
          </label>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-700">
              Attachments
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Once upload endpoint is enabled, you’ll be able to attach files
              here.
            </div>
            <button
              disabled
              className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-400"
            >
              Upload (placeholder)
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white",
              !canSubmit || submitting
                ? "bg-slate-300"
                : "bg-indigo-600 hover:bg-indigo-700",
            )}
          >
            {submitting ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString();
}

function statusTone(status) {
  const s = String(status || "").toUpperCase();
  if (s === "NEED_INFO") return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "IN_REVIEW") return "bg-sky-100 text-sky-800 border-sky-200";
  if (s === "SUBMITTED")
    return "bg-indigo-100 text-indigo-800 border-indigo-200";
  if (s === "COMPLETED")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "REJECTED") return "bg-rose-100 text-rose-800 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function UserDashboard() {
  const { user } = useAuth() || {};
  const navigate = useNavigate();

  const [rangeKey, setRangeKey] = useState("7D");
  const [loadingTop, setLoadingTop] = useState(true);

  const [summary, setSummary] = useState(null);
  const [missingSummary, setMissingSummary] = useState(false);

  const [activity, setActivity] = useState([]);
  const [missingActivity, setMissingActivity] = useState(false);

  const [recentCases, setRecentCases] = useState([]);
  const [missingCases, setMissingCases] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const params = useMemo(() => ({ range: rangeKey }), [rangeKey]);

  async function load() {
    setLoadingTop(true);

    const s = await getMySummary(params);
    setMissingSummary(!!s.missing);
    setSummary(s.ok ? s.data : null);

    const a = await listMyActivity({ ...params, limit: 8 });
    setMissingActivity(!!a.missing);
    setActivity(a.ok ? a.data?.items || a.data || [] : []);

    // Pull more cases so we can compute “focus counts”
    const c = await listMyCases({ limit: 50 });
    setMissingCases(!!c.missing);
    const items = c.ok ? c.data?.items || c.data || [] : [];
    setRecentCases(items.slice(0, 6));

    setLoadingTop(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const derived = useMemo(() => {
    const all = recentCases || [];
    const total = (summary?.openCount ?? 0) + (summary?.closedCount ?? 0);

    const needInfo = all.filter(
      (x) => String(x.status).toUpperCase() === "NEED_INFO",
    ).length;
    const inReview = all.filter(
      (x) => String(x.status).toUpperCase() === "IN_REVIEW",
    ).length;
    const incidents = all.filter(
      (x) => String(x.type).toUpperCase() === "INCIDENT",
    ).length;

    const open = summary?.openCount ?? 0;
    const closed = summary?.closedCount ?? 0;
    const training = summary?.trainingCompletion ?? null;

    return { total, open, closed, training, needInfo, inReview, incidents };
  }, [recentCases, summary]);

  const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

  return (
    <div className="space-y-5">
      {/* HERO */}
      <Surface className="overflow-hidden">
        <div className="grid gap-5 p-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <div className="text-4xl font-bold text-indigo-600">
              Welcome back,
            </div>
            <div className="mt-3 text-3xl font-semibold text-slate-800">
              {user?.fullName || user?.name || "User"}
            </div>
            <div className="mt-2 text-base text-slate-700 leading-relaxed">
              Track your requests, report incidents, and complete mandatory
              training. This dashboard shows what needs your attention.
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 shadow-md rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Create Request
              </button>

              <Link
                to="/user/cases"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:shadow-sm"
              >
                View My Requests
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>

            {/* Range pills */}
            <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {["1D", "7D", "30D", "12M"].map((k) => (
                <button
                  key={k}
                  onClick={() => setRangeKey(k)}
                  className={cn(
                    "rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                    rangeKey === k
                      ? "bg-white text-slate-700 shadow-sm"
                      : "text-slate-600 hover:bg-white",
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* Focus box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-base font-semibold text-slate-800">
              What to focus on
            </div>

            <div className="mt-4 space-y-3">
              <button
                onClick={() => navigate("/user/cases?status=NEED_INFO")}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-slate-500" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">
                      Requests needing info
                    </div>
                    <div className="mt-0.5 text-sm text-slate-600">
                      Add missing details to unblock review.
                    </div>
                  </div>
                  <div className="ml-auto rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-800">
                    {derived.needInfo}
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate("/user/cases?type=INCIDENT")}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 text-slate-500" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">
                      Incident reporting
                    </div>
                    <div className="mt-0.5 text-sm text-slate-600">
                      Report quickly and attach screenshots if possible.
                    </div>
                  </div>
                  <div className="ml-auto rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-sm font-semibold text-rose-800">
                    {derived.incidents}
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigate("/user/training")}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <GraduationCap className="mt-0.5 h-5 w-5 text-slate-500" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800">
                      Mandatory training
                    </div>
                    <div className="mt-0.5 text-sm text-slate-600">
                      Complete before due date to stay compliant.
                    </div>
                  </div>
                  <div className="ml-auto rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-800">
                    {derived.training == null ? "—" : `${derived.training}%`}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Surface>

      {/* KPI CARDS */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {loadingTop ? (
          <>
            <Skeleton className="h-[132px]" />
            <Skeleton className="h-[132px]" />
            <Skeleton className="h-[132px]" />
            <Skeleton className="h-[132px]" />
          </>
        ) : missingSummary ? (
          <div className="md:col-span-2 xl:col-span-4">
            <EndpointMissing label="Dashboard summary" />
          </div>
        ) : (
          <>
            <KpiCard
              title="Total"
              subtitle="All requests"
              value={derived.total}
              percentLabel={{ value: 100, text: "100% of total" }}
              icon={FolderOpen}
              tone="indigo"
              onClick={() => navigate("/user/cases")}
            />
            <KpiCard
              title="Open"
              subtitle="Not closed"
              value={derived.open}
              percentLabel={{
                value: pct(derived.open, Math.max(1, derived.total)),
                text: `${pct(derived.open, Math.max(1, derived.total))}% of total`,
              }}
              icon={Flame}
              tone="amber"
              onClick={() => navigate("/user/cases?status=SUBMITTED")}
            />
            <KpiCard
              title="In review"
              subtitle="Waiting decision"
              value={derived.inReview}
              percentLabel={{
                value: pct(derived.inReview, Math.max(1, derived.total)),
                text: `${pct(derived.inReview, Math.max(1, derived.total))}% of total`,
              }}
              icon={Eye}
              tone="sky"
              onClick={() => navigate("/user/cases?status=IN_REVIEW")}
            />
            <KpiCard
              title="Need info"
              subtitle="Action required"
              value={derived.needInfo}
              percentLabel={{
                value: pct(derived.needInfo, Math.max(1, derived.total)),
                text: `${pct(derived.needInfo, Math.max(1, derived.total))}% of total`,
              }}
              icon={AlertTriangle}
              tone="rose"
              onClick={() => navigate("/user/cases?status=NEED_INFO")}
            />
          </>
        )}
      </div>

      {/* Segments row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent requests */}
        <Surface className="p-5 shadow-sm border border-indigo-200/70">
          <SectionHeader
            title="My tasks & requests"
            subtitle="Your most recent cases and their status"
            right={
              <button
                onClick={() => navigate("/user/cases")}
                className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-1 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                See all
              </button>
            }
          />

          <div className="mt-4">
            {missingCases ? (
              <EndpointMissing label="Cases list" />
            ) : recentCases.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                No requests yet. Create your first request to get started.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentCases.map((x) => (
                  <button
                    key={x.id}
                    onClick={() => navigate(`/user/cases/${x.id}`)}
                    className={cn(
                      "w-full rounded-xl shadow-sm border border-indigo-200/70 bg-white p-4 text-left",
                      "transition hover:shadow-md",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-800">
                          {x.title}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {x.type || "—"} • Updated {fmtDate(x.updatedAt)}
                        </div>
                      </div>

                      <div
                        className={cn(
                          "shrink-0 rounded-xl border px-2.5 py-1 text-sm font-semibold",
                          statusTone(x.status),
                        )}
                      >
                        {x.status || "—"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Surface>

        {/* Activity feed */}
        <Surface className="p-5 shadow-sm border border-slate-200/70">
          <SectionHeader
            title="Recent updates"
            subtitle="What changed in your items"
          />
          <div className="mt-4">
            {missingActivity ? (
              <EndpointMissing label="Activity feed" />
            ) : activity.length === 0 ? (
              <div className="rounded-xl border border-indigo-200/70 bg-slate-50 p-5 text-sm text-slate-700">
                No recent updates yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-indigo-200/70 bg-white">
                {activity.slice(0, 8).map((a, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      a.caseId && navigate(`/user/cases/${a.caseId}`)
                    }
                    className={cn(
                      "w-full text-left p-4 transition",
                      idx !== 0 && "border-t border-indigo-100",
                      a.caseId ? "hover:bg-indigo-50" : "cursor-default",
                    )}
                  >
                    <div className="text-sm font-semibold text-slate-800">
                      {a.title || a.message || "Update"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {(a.type || "Case") + (a.by ? ` • ${a.by}` : "")}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {fmtDate(a.updatedAt || a.createdAt || a.time)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Surface>

        {/* Quick actions */}
        <Surface className="p-5 shadow-sm border border-indigo-200/70">
          <SectionHeader
            title="Quick actions"
            subtitle="Common actions users take"
          />

          <div className="mt-4 space-y-3">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-left shadow-sm transition hover:shadow-md"
            >
              <div className="text-sm font-semibold text-indigo-900">
                Create a request
              </div>
              <div className="mt-1 text-sm text-indigo-800/80">
                DSR, incident report, vendor request, or privacy question.
              </div>
            </button>

            <button
              onClick={() => navigate("/user/training")}
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left shadow-sm transition hover:shadow-md"
            >
              <div className="text-sm font-semibold text-emerald-900">
                Open training
              </div>
              <div className="mt-1 text-sm text-emerald-800/80">
                Complete mandatory modules before due date.
              </div>
            </button>

            <button
              onClick={() => navigate("/user/profile")}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-5 text-left shadow-sm transition hover:shadow-md"
            >
              <div className="text-sm font-semibold text-slate-800">
                Manage profile
              </div>
              <div className="mt-1 text-sm text-slate-600">
                View account details and update password (if enabled).
              </div>
            </button>
          </div>
        </Surface>
      </div>

      <CreateRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => navigate(`/user/cases/${id}`)}
      />
    </div>
  );
}
